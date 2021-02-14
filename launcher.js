const VehicleStage = require('./modules/vehicle.js')
const {MV, AV, CXMA, CYMA, massGeometry} = require('./modules/initial.js')
const {alphaControls, fuelControls} = require('./modules/controls.js')
const {localHoryzonTh, totalHeight, globeRange} = require('./modules/trajectoryUtils.js')

const fs = require('fs')

const testStage = new VehicleStage()

testStage.init(
	massGeometry.mFuel,
	massGeometry.mDry,
	massGeometry.sMid,
	massGeometry.jRel,
	MV,
	AV,
	CXMA,
	CYMA
)

testStage.getKinematics(0, 10, 0, (6.3711*1E+6) + 10)
testStage.setupPitchControl(alphaControls[0])
testStage.setupFuelControl(fuelControls[0])

const testTrj = testStage.integrate(0, 95, 0.1)

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