require('babel-register')({
  ignore(path) {
    switch (true) {
      case path.includes('/node_modules/'):
        return true
      default:
        return false
    }
  },
})

require('..')
