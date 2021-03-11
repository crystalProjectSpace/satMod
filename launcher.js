const {getInitData, trj2CSV} = require('./modules/fileUtils.js')

getInitData('./enviro/earth.json')
.then(({R, K, atmosphere}) => {
	const AtmoModel = require('./modules/atmoModel.js')
	
	const Atmo = new AtmoModel()
	Atmo.initAtmo(atmosphere)
	
	global.ENVIRO = {
		RE: R,
		KE: K,
		Atmo
	}
	
	return getInitData('./data/vehicle_1.json')
})
.then(({initData, alpha_controls, fuel_controls, stage_controls}) => {
	const CompositeVehicle = require('./modules/compositeVehicle.js')
	const {setupControls} = require('./modules/controls.js')
	
	const fallDown = function(dataPoint) {
		const {kinematics} = dataPoint
		const totalH = Math.sqrt(kinematics[2] * kinematics[2] + kinematics[3] * kinematics[3])
		return totalH < 6.3711E+6
	}
	
	const controlFunctions = setupControls(alpha_controls, fuel_controls, stage_controls)
	
	const testVehicle = new CompositeVehicle()
	
	testVehicle.setupVehicle(initData, controlFunctions)

	const testTrajectory = testVehicle.calcTrajectory(fallDown, [0, 10, 0, 6.3711E+6 + 10], 0.1)

	trj2CSV(testTrajectory, 'test_trajectory')
})