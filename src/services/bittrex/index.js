import { Promise } from 'bluebird'
import { bittrex } from './bittrex'

export default Promise.promisifyAll(bittrex)
// export default bittrex
