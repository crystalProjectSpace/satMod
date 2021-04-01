const {getInitData, trj2CSV} = require('./modules/fileUtils.js')
//===========================================================
/*getInitData('./model.json')
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
	.then(({initData, alpha_controls, fuel_controls, stage_controls}) => {
		const CompositeVehicle = require('./modules/compositeVehicle.js')
		const {setupControls} = require('./modules/controls.js')
		const {local2Global, analyzeTrajectory} = require('./modules/trajectoryUtils.js')

		const {Vx, Vy, X, Y} = local2Global(launchConditions.V, launchConditions.H, launchConditions.Th)
		
		const timeOut = function(dataPoint) {
			const {t, kinematics} = dataPoint
			const totalH = Math.sqrt(kinematics[2] * kinematics[2] + kinematics[3] * kinematics[3])
			return dataPoint.t > 950 || totalH < global.ENVIRO.RE
		}
		
		const controlFunctions = setupControls(alpha_controls, fuel_controls, stage_controls)
		
		const testVehicle = new CompositeVehicle()
		
		testVehicle.setupVehicle(initData, controlFunctions)

		const testTrajectory = testVehicle.calcTrajectory(timeOut, [Vx, Vy, X, Y], dT)
		
		const analyzedTrajectory = analyzeTrajectory(testTrajectory, 5)

		trj2CSV(analyzedTrajectory, 'test_trajectory')
	})	
})*/

global.ENVIRO = { RE: 6.3711E+6 }

const Vector = require('./modules/vectorOps.js')
const trajectoryUtils = require('./modules/trajectoryUtils.js')

const W = -88.5

const H = 5E+3

const Th = 20
const Psi = 0 

for(let i = 0; i < 73; i++) {
	const L = i * 5
	const test_1 = trajectoryUtils.local2Global(7000, H, Th/57.3, Psi/57.3, W/57.3, L/57.3)
	const {Vx, Vy, Vz, X, Y, Z} = test_1

	const test_2 = trajectoryUtils.localHoryzonTh(Vx, Vy, Vz, X, Y, Z)
	console.log(L, test_2 * 57.3)
}