'use strict'

const fs = require('fs')

const fileUtils = {
	/**
	* @description Записать основные траекторные данные в csv-файл
	* @param {Array.<Array.<Number>>} Массив базовых траекторных данных (время + скорости/координаты)
	* @param {Name} имя файла, в который ведется запись результатов
	*/
	trj2CSV: function(data, name) {
		const strData = data.map(dataPoint => {

			const [
				t,		// текущее время
				Vabs,	// абсолютная скорость
				ThLocal,// угол наклона траектории к местному горизонту
				H,		// высота над уровнем планеты
				L,		// пройденная дальность
				m,		// текущая масса
				nX,		// тангенциальное ускорение
				nY,		// нормальное ускорение
				dM,		// расход массы 
				Q,		// скоростной напор
				X,		// продольная координата (ГСК)
				Y,		// поперечная координата (ГСК)
				Vx,		// скорость продольная (ГСК)
				Vy		// скорость поперечная (ГСК)
			] = dataPoint
			
			return [
				t.toFixed(1),
				Vabs.toFixed(1),
				(ThLocal * 57.3).toFixed(2),
				H.toFixed(0),
				L.toFixed(0),
				m.toFixed(0),
				nX.toFixed(2),
				nY.toFixed(2),
				dM.toFixed(2),
				Q.toFixed(0),
				X.toFixed(0),
				Y.toFixed(0),
				Vx.toFixed(1),
				Vy.toFixed(1)
		].join(',\t')
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
	},
	/**
	* @description Считать данные из стороннего файла
	* @async
	* @param {String} path
	* @return {Promise}
	*/
	getInitData: function(path) {
		return new Promise((resolve, reject) => {
			fs.readFile(path, 'ascii',(err, rawData) => {
				if(err) {
					reject(err)
				} else {
					const initData = JSON.parse(rawData)
					resolve(initData)
				}
			}) 
		})
	},
	/**
	* @description получить список файлов директории
	* @async
	* @param {String} path
	* @return {Promise} 
	*/
	getDirContent: function(path) {
		return new Promise((resolve, reject) => {
			fs.readdir(path, (err, dirContent) => {
				if(err) {
					reject(err)
				} else {
					resolve(dirContent)
				}
			})
		})
	}
}

module.exports = fileUtils