const CompositeVehicle = require('./modules/compositeVehicle.js')
const {initData, stageFunctions} = require('./modules/initial.js')
const controlFunctions = require('./modules/controls.js')
const {localHoryzonTh, totalHeight, absVelocity, globeRange} = require('./modules/trajectoryUtils.js')

const fs = require('fs')

const testVehicle = new CompositeVehicle()

const fallDown = function(dataPoint) {
	const {kinematics} = dataPoint
	const totalH = Math.sqrt(kinematics[2] * kinematics[2] + kinematics[3] * kinematics[3])
	return totalH < 6.3711E+6
}

testVehicle.setupVehicle(initData, controlFunctions, stageFunctions)

const testTrajectory = testVehicle.calcTrajectory(fallDown, [0, 10, 0, 6.3711E+6 + 10], 0.1)

testTrajectory.forEach(trjPoint => {
	
	const {t, kinematics} = trjPoint
	const [Vx, Vy, X, Y, m] = kinematics
	console.log([
		t.toFixed(1),
		absVelocity(Vx, Vy).toFixed(1),
		localHoryzonTh(Vx, Vy, X, Y).toFixed(2),
		totalHeight(X, Y).toFixed(0),
		globeRange(X, Y).toFixed(0),
		m.toFixed(0)
	].join(' | '))
})