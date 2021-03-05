'use strict'

const VehicleStage = require('./vehicleStage.js')
const {performance} = require('perf_hooks')

class CompositeVehicle {
	constructor() {
		this.stages = []
		this.stageMasses = []
		this.stageFunctions = []
		this.nStage = 0
		this.currentStage = 0
	}
	/**
	* @description получить баллистическую сводку для ИД
	*/
	setupVehicle(stageData, stageControls, stageFunctions) {
		this.nStage = stageData.length
		
		this.stageFunctions = stageFunctions
		
		this.stageMasses.length = this.nStage
		
		let m0_total = 0
		let mDry_total = 0
		
		for(let i = 0; i < this.nStage; i++) {
			const i0 = this.nStage - i - 1
			const {mDry, mFuel} = stageData[i0].massGeometry
			
			mDry_total = mDry + m0_total
			m0_total += (mDry + mFuel)
			
			this.stageMasses[i0] = {
				m0: mDry_total,
				m1: m0_total
			}
		}		
		
		this.stages = stageData.map((stage, i) => {
			const result = new VehicleStage()
			const {massGeometry, ADX} = stage
			const {alphaControls, fuelControls} = stageControls[i]
			
			result.init(
				massGeometry.mFuel,
				this.stageMasses[i].m0,
				massGeometry.sMid,
				massGeometry.jRel,
				ADX.MV,
				ADX.AV,
				ADX.CXMA,
				ADX.CYMA
			)
			
			result.setupPitchControl(alphaControls)
			result.setupFuelControl(fuelControls)
			
			return result
		})
	}
	/**
	* @description Задать кинематические параметры для ступени в момент ее включения
	*/
	setupStageKinematics(Vx, Vy, X, Y) {
		this.stages[this.currentStage].getKinematics(Vx, Vy, X, Y)
	}
	/**
	* @description Разделение ступеней
	*/
	changeStage(Vx, Vy, X, Y) {
		this.currentStage++
		this.setupStageKinematics(Vx, Vy, X, Y)
	}
	/**
	* @description Сквозной расчет всей траектории с учетом разделения ступеней
	* @param {Function}
	* @param {Array.<Number>}
	* @param {Number}
	* @return {Array}
	*/
	calcTrajectory(globalFlag, startConditions, dT) {
		let tau = 0
		let globalResult = []
		const conditions = {t: tau, kinemtics: startConditions}
		this.setupStageKinematics(startConditions[0], startConditions[1], startConditions[2], startConditions[3])
		const timeStart = performance.now()
		
		console.log('Trajectory calculation started\n')
		
		for(let i = 0; i < this.nStage; i++) {
			const {result, nextStage, finishFlight} = this.stages[i].integrate(
				tau,
				globalFlag,
				this.stageFunctions[i],
				dT
			)
			
			globalResult = globalResult.concat(result)
			const lastIndex = globalResult.length - 1
			
			if(!finishFlight) {
				const lastPoint = globalResult[lastIndex].kinematics
				tau = globalResult[lastIndex].t
				
				const Vx = lastPoint[0]
				const Vy = lastPoint[1]
				const X = lastPoint[2]
				const Y = lastPoint[3]
				
				this.changeStage(Vx, Vy, X, Y)
				
				console.log(`t: ${tau}; stage ${i} activated`)
			} else {
				break;
			}
		}
		
		console.log(`Trajectory calc cmpl\nTime elapsed: ${(performance.now() - timeStart).toFixed(3)}ms\n`)
		
		return globalResult
	}
}

module.exports = CompositeVehicle