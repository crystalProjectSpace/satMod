const VehicleStage = require('./modules/vehicle.js')
const initData = require('./modules/initial.js')
const controlFunctions = require('./modules/controls.js')

const {MV, AV, CXMA, CYMA} = initData
const {alphaControls, fuelControls} = controlFunctions

const testStage = new VehicleStage()
testStage.init(7500, 1750, 0.55, 3050, MV, AV, CXMA, CYMA)
testStage.getKinematics(0, 10, 0, (6.3711*1E+6) + 10)
testStage.setupPitchControl(alphaControls[0])
testStage.setupFuelControl(fuelControls[0])

const testTrj = testStage.integrate(0, 85, 0.1)

const localHoryzonTh = function(Vx, Vy, X, Y) {
	const absV2 = Vx * Vx + Vy * Vy
	const absR2 = X * X + Y * Y
	return Math.acos((Vx * Y - Vy * X)/Math.sqrt(absV2 * absR2)) * 57.3
}

const totalHeight = function(X, Y) {
	return Math.sqrt(X * X + Y * Y) - 6.3711 * 1E+6
}

const globeRange = function(X, Y) {
	return 6.3711 * 1E+6 * Math.atan(X/Y)
}

testTrj.forEach( trjPoint => {
	const {t, kinematics} = trjPoint
	
	const Vx = kinematics[0]
	const Vy = kinematics[1]
	const X = kinematics[2]
	const Y = kinematics[3]
	const m = kinematics[4]
	
	const V = Math.sqrt(Vx * Vx + Vy * Vy)
	const Th = localHoryzonTh(Vx, Vy, X, Y)
	const H = totalHeight(X, Y)
	const L = globeRange(X, Y)
	
	console.log([
		t.toFixed(2),
		V.toFixed(2),
		Th.toFixed(2),
		H.toFixed(1),
		L.toFixed(1),
		m.toFixed(1)
	].join(' | '))
})