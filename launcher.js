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
			vCircular: H => Math.sqrt(KE / (R + H))
		}
		
		return getInitData(vehicleDataPath)
	})
	.then(({initData, alpha_controls, fuel_controls, stage_controls}) => {
		const CompositeVehicle = require('./modules/compositeVehicle.js')
		const {setupControls} = require('./modules/controls.js')
		const {local2Global} = require('./modules/trajectoryUtils.js')
		
		const {Vx, Vy, X, Y} = local2Global(launchConditions.V, launchConditions.H, launchConditions.Th)
		
		const fallDown = function(dataPoint) {
			const {kinematics, t} = dataPoint
			const totalH = Math.sqrt(kinematics[2] * kinematics[2] + kinematics[3] * kinematics[3])
			return totalH < global.ENVIRO.RE
		}
		
		const controlFunctions = setupControls(alpha_controls, fuel_controls, stage_controls)
		
		const testVehicle = new CompositeVehicle()
		
		testVehicle.setupVehicle(initData, controlFunctions)

		const testTrajectory = testVehicle.calcTrajectory(fallDown, [Vx, Vy, X, Y], dT)

		trj2CSV(testTrajectory, 'test_trajectory')
	})	
})