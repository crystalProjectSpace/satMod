const VehicleStage = require('./modules/vehicle.js')
const initData = require('./modules/initial.js')

const {MV, AV, CXMA, CYMA} = initData

const testStage = new VehicleStage()
testStage.init(7500, 1750, 0.375, 3050, MV, AV, CXMA, CYMA)
testStage.getKinematics(0, 10, 0, (6.3711*1E+6) + 10)

console.log(testStage)