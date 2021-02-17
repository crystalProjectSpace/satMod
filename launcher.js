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

const trj2CSV = function(data, name) {
	const strData = data.map(dataPoint => {
		const {t, kinematics} = dataPoint
		const [Vx, Vy, X, Y, m] = kinematics
		
		return [
			t.toFixed(1),
			absVelocity(Vx, Vy).toFixed(1),
			localHoryzonTh(Vx, Vy, X, Y).toFixed(2),
			totalHeight(X, Y).toFixed(0),
			globeRange(X, Y).toFixed(0),
			m.toFixed(0)
	].join(', ')
	}).join('\n')
	
	fs.writeFile(`${name}.csv`, strData, 'ascii', function(err) { if(err) { console.log('failed to save result'); console.log(err)}})
}

testVehicle.setupVehicle(initData, controlFunctions, stageFunctions)

const testTrajectory = testVehicle.calcTrajectory(fallDown, [0, 10, 0, 6.3711E+6 + 10], 0.1)

trj2CSV(testTrajectory, 'test_trajectory')