const {getInitData, trj2CSV} = require('./modules/fileUtils.js')
//===========================================================
getInitData('./model.json')
.then( modelConfig => {
	const {activeVariant, initialVars} = modelConfig
	const {vehicle, planet, launchConditions, dT} = initialVars[activeVariant]
			
	const planetDataPath = `./enviro/${planet.toLowerCase()}.json`
	const vehicleDataPath = `./data/${vehicle.toLowerCase()}.json`
	
	getInitData(planetDataPath)
	.then(({R, K, atmosphere}) => {
		const AtmoModel = require('./modules/atmoModel.js')

		const Atmo = new AtmoModel()
		Atmo.initAtmo(atmosphere)
		
		global.ENVIRO = {
			RE: R,
			KE: K,
			Atmo,
			vCircular: H => Math.sqrt(K / H)
		}
		
		return getInitData(vehicleDataPath)
	})
	.then(({initData, alpha_controls, fuel_controls, roll_controls,  stage_controls}) => {
		const CompositeVehicle = require('./modules/compositeVehicle.js')
		const {setupControls} = require('./modules/controls.js')
		const {local2Global, analyzeTrajectory} = require('./modules/trajectoryUtils.js')

		const {V, H, Th, Psi, W, L} = launchConditions
		const {Vx, Vy, Vz, X, Y, Z} = local2Global(V, H, Th / 57.3, Psi / 57.3, W / 57.3, L/57.3)
		
		const timeOut = function(dataPoint) {
			const {t, kinematics} = dataPoint
			const totalH = Math.sqrt(kinematics[3] * kinematics[3] + kinematics[4] * kinematics[4] + kinematics[5] * kinematics[5])
			return dataPoint.t > 850 || totalH < global.ENVIRO.RE
		}
		
		const controlFunctions = setupControls(alpha_controls, fuel_controls, roll_controls, stage_controls)
		
		const testVehicle = new CompositeVehicle()
		
		testVehicle.setupVehicle(initData, controlFunctions)

		const testTrajectory = testVehicle.calcTrajectory(timeOut, [Vx, Vy, Vz, X, Y, Z], dT)
		
		const analyzedTrajectory = analyzeTrajectory(testTrajectory, 5)
		
		trj2CSV(analyzedTrajectory, 'test_trajectory')
	})	
})