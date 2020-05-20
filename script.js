const video = document.getElementById('video');
let predictedAges = [];

Promise.all([
	faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
	faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
	faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
	faceapi.nets.faceExpressionNet.loadFromUri('/models'),
	faceapi.nets.ageGenderNet.loadFromUri('/models'),
	console.log(faceapi),
]).then(startVideo);

function startVideo() {
	navigator.getUserMedia(
		{
			video: {},
		},
		(stream) => (video.srcObject = stream),
		(err) => console.error(err)
	);
}

video.addEventListener('play', () => {
	const canvas = faceapi.createCanvasFromMedia(video);
	document.body.append(canvas);
	const displaySize = { width: video.width, height: video.height };
	faceapi.matchDimensions(canvas, displaySize);
	setInterval(async () => {
		const detections = await faceapi
			.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
			.withFaceLandmarks()
			.withFaceExpressions()
			.withAgeAndGender();

		const resizedDetections = faceapi.resizeResults(detections, displaySize);
		canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
		faceapi.draw.drawDetections(canvas, resizedDetections);
		faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
		faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

		const gender = await resizedDetections[0].gender;
		const genderProbability = resizedDetections[0].genderProbability.toFixed(2);

		const age = resizedDetections[0].age;
		const interpolatedAge = interpolateAgePredictions(age);

		const bottomRight = {
			x: resizedDetections[0].detection.box.bottomRight.x - 50,
			y: resizedDetections[0].detection.box.bottomRight.y,
		};
		const center = {
			x: resizedDetections[0].detection.box.bottomRight.x - 190,
			y: resizedDetections[0].detection.box.bottomRight.y,
		};

		const centerBottom = {
			x: resizedDetections[0].detection.box.bottomRight.x - 150,
			y: resizedDetections[0].detection.box.bottomRight.y + 20,
		};
		new faceapi.draw.DrawTextField(
			[`${faceapi.round(interpolatedAge, 0)} years`],
			bottomRight
		).draw(canvas);
		new faceapi.draw.DrawTextField([`${gender}(${genderProbability}) gender`], center).draw(canvas);
		// new faceapi.draw.DrawTextField(
		// 	[`${genderProbability} `],
		// 	centerBottom
		// ).draw(canvas);
		// const box = { x: 50, y: 50, width: 100, height: 100 };
	}, 100);
});

function interpolateAgePredictions(age) {
	predictedAges = [age].concat(predictedAges).slice(0, 50);
	const avgPredictedAge =
		predictedAges.reduce((total, a) => total + a) / predictedAges.length;
	return avgPredictedAge;
}
