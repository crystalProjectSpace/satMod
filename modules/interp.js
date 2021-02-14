/**
* @description класс одномерной интерполяции 
*/
class Interp_1D {
	constructor() {
		this.XV = []
		this.YV = []
		this.koef = 0
		this.index = 0
		this.nX = 0
	}
	/**
	* @description задать опорные точки для интерполяции
	* @return {Object}
	*/
	init(X0, XV, YV) {
		this.XV = XV
		this.YV = YV
		this.nX = this.XV.length
		
		for(let i = 0; i < this.nX; i++) {
			if(this.XV[i + 1] > X0) {
				this.index = i
				this.koef = (this.YV[i + 1] - this.YV[i]) / (this.XV[i + 1] - this.XV[i])
				break;
			}
		}
		
		return this
	}
	/**
	* @description проверить текущий индекс интерполяции
	* @return {void}
	*/
	checkX(X) {
		if( X > this.XV[this.index + 1]) {
			this.index++
			const i0 = this.index + 1
			this.koef = (this.YV[i0] - this.YV[this.index])/(this.XV[i0] - this.XV[this.index])
		} else if ( X < this.XV[this.index]) {
			const i0 = this.index--
			this.koef = (this.YV[i0] - this.YV[this.index])/(this.XV[i0] - this.XV[this.index])
		}
	}
	/**
	* @description выполнить одномерную интерполяции
	* @return {Number} 
	*/
	interp(X) {
		return this.YV[this.index] + this.koef * (X - this.XV[this.index])
	}
}
/**
* @description класс двухмерной интерполяции 
*/
class Interp_2D {
	constructor() {
		this.XV_1 = []
		this.XV_2 = []
		this.YV = []
		this.index_1 = 0
		this.index_2 = 0
		this.nX1 = 0
		this.nX2 = 0
	}
	/**
	* @description заполнить вектора опорных значений
	* @return {void}
	*/
	init(XV_1, XV_2, YV) {
		this.XV_1 = XV_1
		this.XV_2 = XV_2
		this.YV = YV
		this.nX1 = this.XV_1.length
		this.nX2 = this.XV_2.length
	}
	/**
	* @description задать отправные значения индексов
	* @return {void}
	*/
	setupIndices(X1, X2) {
		this.index_1 = 0
		this.index_2 = 0
		
		while(this.XV_1[this.index_1 + 1] < X1) { this.index_1++ }
		
		while(this.XV_2[this.index_2 + 1] < X2) { this.index_2++ }
	}
	/**
	* @description проверить текущие значения индексов
	* @return {void}
	*/
	checkArgs(X1, X2) {
		if( X1 > this.XV_1[this.index_1 + 1]) {
			this.index_1++
		} else if ( X1 < this.XV_1[this.index_1]) {
			this.index_1--
		}
		
		if( X2 > this.XV_2[this.index_2 + 1]) {
			this.index_2++
		} else if ( X2 < this.XV_2[this.index_2]) {
			this.index_2--
		}
	}
	/**
	* @description выполнить интерполяцию
	* @return {Number}
	*/
	interp(X1, X2) {
		const i_21 = this.index_2 + 1
		const i_11 = this.index_1 + 1

		const d_X_2 = (X2 - this.XV_2[this.index_2]) / ( this.XV_2[i_21] - this.XV_2[this.index_2] ) 

		const Y1 = this.YV[this.index_1][this.index_2] + (this.YV[this.index_1][i_21] - this.YV[this.index_1][this.index_2]) * d_X_2
		const Y2 = this.YV[i_11][this.index_2] + (this.YV[i_11][i_21] - this.YV[i_11][this.index_2]) * d_X_2
		
		return Y1 + (Y2 - Y1) * (X1 - this.XV_1[this.index_1]) / (this.XV_1[i_11] - this.XV_1[this.index_1])
	}
}

const interpolations = {
	Interp_1D: Interp_1D,
	Interp_2D: Interp_2D,
}

module.exports = interpolations