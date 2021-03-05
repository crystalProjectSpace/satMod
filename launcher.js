const CompositeVehicle = require('./modules/compositeVehicle.js')
const {initData, stageFunctions} = require('./modules/initial.js')
const {setupControls} = require('./modules/controls.js')
const {trj2CSV} = require('./modules/outputHandler.js')
const fs = require('fs')

fs.readFile('./data/vehicle_1.json', 'ascii', (err, rawData) => {
	const fallDown = function(dataPoint) {
		const {kinematics} = dataPoint
		const totalH = Math.sqrt(kinematics[2] * kinematics[2] + kinematics[3] * kinematics[3])
		return totalH < 6.3711E+6
	}
	
	const {initData, alpha_controls, fuel_controls} = JSON.parse(rawData)
	const controlFunctions = setupControls(alpha_controls, fuel_controls)
	
	const testVehicle = new CompositeVehicle()
	
	testVehicle.setupVehicle(initData, controlFunctions, stageFunctions)

	const testTrajectory = testVehicle.calcTrajectory(fallDown, [0, 10, 0, 6.3711E+6 + 10], 0.1)

	trj2CSV(testTrajectory, 'test_trajectory')
})


