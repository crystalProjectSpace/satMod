'use strict'

const fs = require('fs')
const {localHoryzonTh, totalHeight, absVelocity, globeRange} = require('./trajectoryUtils.js')

module.exports = {
	/**
	* @description Записать основные траекторные данные в csv-файл
	* @param {Array.<{t: Number, kinematics: Array.<Number>}>} Массив базовых траекторных данных (время + скорости/координаты)
	* @param {Name} имя файла, в который ведется запись результатов
	*/
	trj2CSV: function(data, name) {
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
		
		fs.writeFile(
			`${name}.csv`,
			strData,
			'ascii',
			function(err) {
				if(err) {
					console.log('failed to save result');
					console.log(err)
				}
			}
		)
	}
}