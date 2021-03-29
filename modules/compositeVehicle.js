'use strict'

const VehicleStage = require('./vehicleStage.js')
const {performance} = require('perf_hooks')

class CompositeVehicle {
	constructor() {
		this.stages = []
		this.stageMasses = []
		this.nStage = 0
		this.currentStage = 0
	}
	/**
	* @description получить баллистическую сводку для ИД
	*/
	setupVehicle(stageData, stageControls) {
		this.nStage = stageData.length
		
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
			const {
				alphaControls,
				gammaControls,
				fuelControls,
				cutOffControls
			} = stageControls[i]
			
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
			result.setupRollControl(gammaControls)
			result.setupFuelControl(fuelControls)
			result.setupStageControl(cutOffControls)
			
			return result
		})
	}
	/**
	* @description Задать кинематические параметры для ступени в момент ее включения
	*/
	setupStageKinematics(Vx, Vy, Vz, X, Y, Z) {
		this.stages[this.currentStage].getKinematics(Vx, Vy, Vz, X, Y, Z)
	}
	/**
	* @description Разделение ступеней
	*/
	changeStage(Vx, Vy, Vz, X, Y, Z) {
		this.currentStage++
		this.setupStageKinematics(Vx, Vy, Vz, X, Y, Z)
	}
	/**
	* @description Сквозной расчет всей траектории с учетом разделения ступеней
	* @param {Function} globalFlag условие полного прекращения полета
	* @param {Array.<Number>} startConditions условия старта
	* @param {Number} dT глобальный шаг интегрирования
	* @return {Array}
	*/
	calcTrajectory(globalFlag, startConditions, dT) {
		let tau = 0
		let globalResult = []
		const conditions = {t: tau, kinemtics: startConditions}
		this.setupStageKinematics(
			startConditions[0],
			startConditions[1],
			startConditions[2],
			startConditions[3],
			startConditions[4],
			startConditions[5],
			startConditions[6]
		)
		const timeStart = performance.now()
		
		console.log('Trajectory calculation started\n')
		
		for(let i = 0; i < this.nStage; i++) {
			const {result, nextStage, finishFlight} = this.stages[i].integrate(
				tau,
				globalFlag,
				dT
			)
			
			globalResult = globalResult.concat(result)
			const lastIndex = globalResult.length - 1
			
			if(!finishFlight) {
				const lastPoint = globalResult[lastIndex].kinematics
				tau = globalResult[lastIndex].t
				
				const Vx = lastPoint[0]
				const Vy = lastPoint[1]
				const Vz = lastPoint[2]
				const X = lastPoint[3]
				const Y = lastPoint[4]
				const Z = lastPoint[5]
				
				this.changeStage(Vx, Vy, Vz, X, Y, Z)
				
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