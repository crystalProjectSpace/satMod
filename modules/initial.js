'use strict'

const initData = {
	MV: [ 0, 0.5, 0.8, 1, 1.3, 1.5, 2, 2.5, 3, 4, 5, 6 ],
	AV: [ -30, -20, -15, -10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10, 15, 20, 30],
	CXMA: [
		[1.345, 0.745, 0.535, 0.385, 0.3418, 0.3082, 0.2842, 0.2698, 0.265, 0.2698, 0.2842, 0.3082, 0.3418, 0.385, 0.535, 0.745, 1.345],
		[1.345, 0.745, 0.535, 0.385, 0.3418, 0.3082, 0.2842, 0.2698, 0.265, 0.2698, 0.2842, 0.3082, 0.3418, 0.385, 0.535, 0.745, 1.345],
		[3.65713, 1.8615, 1.23303, 0.78413, 0.65484, 0.55429, 0.48246, 0.43937, 0.425, 0.43937, 0.48246, 0.55429, 0.65484, 0.78413, 1.23303, 1.8615, 3.65713],
		[3.215, 1.64, 1.08875, 0.695, 0.5816, 0.4934, 0.4304, 0.3926, 0.38, 0.3926, 0.4304, 0.4934, 0.5816, 0.695, 1.08875, 1.64, 3.215],
		[3.04306, 1.55525, 1.03452, 0.66256, 0.55544, 0.47212, 0.41261, 0.3769, 0.365, 0.3769, 0.41261, 0.47212, 0.55544, 0.66256, 1.03452, 1.55525, 3.04306],
		[2.86831, 1.46925, 0.97958, 0.62981, 0.52908, 0.45073, 0.39477, 0.36119, 0.35, 0.36119, 0.39477, 0.45073, 0.52908, 0.62981, 0.97958, 1.46925, 2.86831],
		[2.41125, 1.255, 0.85031, 0.56125, 0.478, 0.41325, 0.367, 0.33925, 0.33, 0.33925, 0.367, 0.41325, 0.478, 0.56125, 0.85031, 1.255, 2.41125],
		[2.19833, 1.15481, 0.78958, 0.5287, 0.45357, 0.39513, 0.35339, 0.32835, 0.32, 0.32835, 0.35339, 0.39513, 0.45357, 0.5287, 0.78958, 1.15481, 2.19833],
		[1.99581, 1.05925, 0.73145, 0.49731, 0.42988, 0.37743, 0.33997, 0.31749, 0.31, 0.31749, 0.33997, 0.37743, 0.42988, 0.49731, 0.73145, 1.05925, 1.99581],
		[1.99581, 1.05925, 0.73145, 0.49731, 0.42988, 0.37743, 0.33997, 0.31749, 0.31, 0.31749, 0.33997, 0.37743, 0.42988, 0.49731, 0.73145, 1.05925, 1.99581],
		[1.99581, 1.05925, 0.73145, 0.49731, 0.42988, 0.37743, 0.33997, 0.31749, 0.31, 0.31749, 0.33997, 0.37743, 0.42988, 0.49731, 0.73145, 1.05925, 1.99581]
	],
	CYMA: [
		[-1.2, -0.8, -0.6, -0.4, -0.32, -0.24, -0.16, -0.08, 0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.6, 0.8, 1.2],
		[-1.2, -0.8, -0.6, -0.4, -0.32, -0.24, -0.16, -0.08, 0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.6, 0.8, 1.2],
		[-1.95, -1.3, -0.975, -0.65, -0.52, -0.39, -0.26, -0.13, 0, 0.13, 0.26, 0.39, 0.52, 0.65, 0.975, 1.3, 1.95],
		[-1.8, -1.2, -0.9, -0.6, -0.48, -0.36, -0.24, -0.12, 0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.9, 1.2, 1.8],
		[-1.725, -1.15, -0.8625, -0.575, -0.46, -0.345, -0.23, -0.115, 0, 0.115, 0.23, 0.345, 0.46, 0.575, 0.8625, 1.15, 1.725],
		[-1.65, -1.1, -0.825, -0.55, -0.44, -0.33, -0.22, -0.11, 0, 0.11, 0.22, 0.33, 0.44, 0.55, 0.825, 1.1, 1.65],
		[-1.5, -1, -0.75, -0.5, -0.4, -0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.75, 1, 1.5],
		[-1.425, -0.95, -0.7125, -0.475, -0.38, -0.285, -0.19, -0.095, 0, 0.095, 0.19, 0.285, 0.38, 0.475, 0.7125, 0.95, 1.425],
		[-1.35, -0.9, -0.675, -0.45, -0.36, -0.27, -0.18, -0.09, 0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.675, 0.9, 1.35],
		[-1.35, -0.9, -0.675, -0.45, -0.36, -0.27, -0.18, -0.09, 0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.675, 0.9, 1.35],
		[-1.35, -0.9, -0.675, -0.45, -0.36, -0.27, -0.18, -0.09, 0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.675, 0.9, 1.35]
	]
}

module.exports = initData