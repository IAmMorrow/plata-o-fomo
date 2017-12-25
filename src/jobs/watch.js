import twitter from '../services/twitter'
import bittrex from '../services/bittrex'

// 961445378
//

let assets

const startPattern = 'Coin of the day:'

async function sellOrder(market, quantity, rate) {
  await bittrex.tradesellAsync({
    MarketName: market,
    OrderType: 'LIMIT',
    Quantity: quantity,
    Rate: rate,
    TimeInEffect: 'GOOD_TIL_CANCELLED',
    ConditionType: 'NONE',
    Target: 0,
  })
}

async function buyOrder(market, quantity, rate) {
  const { result: { OrderId } } = await bittrex.tradebuyAsync({
    MarketName: market,
    OrderType: 'LIMIT',
    Quantity: quantity,
    Rate: rate,
    TimeInEffect: 'IMMEDIATE_OR_CANCEL',
    ConditionType: 'NONE',
    Target: 0,
  })

  const { result } = await bittrex.getorderAsync({ uuid: OrderId })

  return result
}

function analysisTweet(tweet) {
  const { text, user } = tweet

  console.log(`got a new tweet from ${user.name}`)

  if (text.startsWith(startPattern)) {
    console.log(`tweet is starting with the "${startPattern}" pattern`)
    findCoin(text)
  } else {
    console.log(`tweet is not starting with "${startPattern}" pattern`)
  }
}

async function findCoin(text) {
  const coin = assets.reduce((result, asset) => (text.includes(asset) ? asset : result), null)

  if (coin) {
    await buyAsset(coin)
  } else {
    console.log('Could not find any coin existing on Bittrex ... :(')
  }
}

async function sellThatShit(market, quantity, baseAsk) {
  await sellOrder(market, quantity / 5, baseAsk * 1.4)
  await sellOrder(market, quantity / 5, baseAsk * 1.6)
  await sellOrder(market, quantity / 5, baseAsk * 1.8)
  await sellOrder(market, quantity / 5, baseAsk * 2.0)
  await sellOrder(market, quantity / 5, baseAsk * 2.2)
}

async function buyAsset(asset) {
  console.log(`tweet is mentioning "${asset}"`)
  console.log(`getting information on BTC-${asset} market from Bittrex`)
  const { result } = await bittrex.getmarketsummaryAsync({ market: `BTC-${asset}` })

  const baseAsk = result[0].Ask
  const quantity = 0.3 / baseAsk

  console.log(`buying ${quantity} ${asset}s from Bittrex`)

  const buy = async (amount, rate) => {
    const order = await buyOrder(`BTC-${asset}`, amount, rate)
    const remaining = order.QuantityRemaining
    console.log(remaining)
    if (remaining) {
      const market = await bittrex.getmarketsummaryAsync({ market: `BTC-${asset}` })
      const actualPrice = market.result[0].Ask

      if (actualPrice / baseAsk < 1.2) {
        return buy(remaining, market)
      }
      console.log(`actual price too expensive already (${actualPrice}), wont buy anymore, fucking fomo :(`)
    }
    return remaining
  }
  const remaining = await buy(quantity, baseAsk)
  if (remaining === quantity) {
    console.log('sadly I could not buy any coin for you :(')
  } else {
    console.log('placing multiple sell orders')
    await sellThatShit(`BTC-${asset}`, quantity - remaining, baseAsk)
  }
}

export async function watch() {
  const { result } = await bittrex.getmarketsummariesAsync()

  const markets = result.filter(({ MarketName }) => MarketName.startsWith('BTC-'))

  assets = markets.map(({ MarketName }) => MarketName.split('-')[1])

  await buyAsset('SC')

  await twitter.stream('statuses/filter', { follow: '730371390822592513' }, stream => {
    stream.on('data', analysisTweet)
  })
}
