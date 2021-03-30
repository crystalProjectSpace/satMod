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

const Vector = require('./modules/vectorOps.js')
const W = 0.1
const L = 1
const H = 5E+3

const Th = 23
const Psi = -40

const V = [
	7000 * Math.cos(Th/57.3) * Math.sin(Psi/57.3),
	7000 * Math.cos(Th/57.3) * Math.cos(Psi/57.3),
	7000 * Math.sin(Th/57.3),
]

const testPoint = Vector.sphere2decart(W/57.3, L/57.3, 6.3711E+6 + H)

const fi = Vector.azimuth(V, testPoint)
console.log(fi * 57.3)