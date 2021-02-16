const CompositeVehicle = require('./modules/compositeVehicle.js')
const {initData, stageFunctions} = require('./modules/initial.js')
const controlFunctions = require('./modules/controls.js')
const {localHoryzonTh, totalHeight, globeRange} = require('./modules/trajectoryUtils.js')

const fs = require('fs')

const testVehicle = new CompositeVehicle()

testVehicle.setupVehicle(initData, controlFunctions, stageFunctions)