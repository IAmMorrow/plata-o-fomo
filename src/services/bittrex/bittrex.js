import bittrex from 'node-bittrex-api'
import config from '../../../config/bittrex'

bittrex.options(config)

export { bittrex }
