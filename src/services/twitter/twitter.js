import Twitter from 'twitter'
import config from '../../../config/twitter'

export const client = new Twitter(config)
