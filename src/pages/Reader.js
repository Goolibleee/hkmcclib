import React, { useEffect, useRef, useState } from "react";
import "./Reader.css";
import axios from "axios";


function Reader(props) {
    const videoRef = useRef();
    const canvasRef = useRef();
    const overlayRef = useRef();
    const [result, setResult] = useState();
    const [resolution, setResolution] = useState([0,0]);

    useEffect(
        function () {
            if (result) {
                props.onScan(result.data);
                setResult(null);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [result]
    );

    useEffect(function () {
        let isMounted = true;
        console.log("Set interval");
        const inter = setInterval(() => {
            if (!isMounted)
            {
                console.log("Unmounted reader call");
                return;
            }
            requestAnimationFrame(tick);
        }, 2000);
        return () => {
            console.log("Clear interval for reader");
            isMounted = false;
            clearInterval(inter);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        function () {
            navigator.mediaDevices
                .getUserMedia({ video: { facingMode: "environment", zoom: true, width:480, height:640 } })
                .then(function (stream) {
                    console.log(stream);
                    console.log("TEST");
                    try {
                        videoRef.current.srcObject = stream;
                        videoRef.current.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
                        videoRef.current.play();
                        /*
                        const [track] = stream.getVideoTracks();
                        const capabilities = track.getCapabilities();
                        const settings = track.getSettings();
                        const imageWidth  = videoRef.current.videoWidth;
                        const imageHeight = videoRef.current.videoHeight;
                        setResolution([imageWidth, imageHeight]);
                        console.log("Set resulution " + imageWidth.toString() + "x" + imageHeight.toString());

                        if (capabilities.focusDistance)
                        {
                            const text = document.getElementsById("text").innerHtml("Change focus");
                            track.applyConstraints({advanced: [ {focusMode: "auto", focusDistance: capabilities.focusDistance.min}]});
                        }
                        else
                        {
                            const text = document.getElementsById("text").innerHtml("Cannot change focus");
                        }
                        */
                    } catch {}
                });
            console.log(window.innerWidth.toString() + "x" + window.innerHeight.toString());
        },
        [videoRef]
    );
    useEffect(
        function () {
            var ctx = overlayRef.current.getContext("2d");
            const imageWidth  = videoRef.current.videoWidth;
            const imageHeight = videoRef.current.videoHeight;
            console.log("Resolution changed " + imageWidth.toString() + "x" + imageHeight.toString());
 //           drawLine(ctx, { x: 20, y: 20, x1: 20, y1: 100 });

            drawLine(ctx, { x: 0, y: imageHeight/2-75, x1: imageWidth, y1: imageHeight/2-75 }, { color: 'red', width:5 });
            drawLine(ctx, { x: 0, y: imageHeight/2+75, x1: imageWidth, y1: imageHeight/2+75 }, { color: 'red', width:5 });
            drawLine(ctx, { x: 0, y: imageHeight/2-75, x1: 0, y1: imageHeight/2+75 }, { color: 'red', width:5 });
            drawLine(ctx, { x: imageWidth, y: imageHeight-75, x1: imageWidth, y1: imageHeight/2+75 }, { color: 'red', width:5 });

//            drawLine(ctx, { x: 300, y: 250, x1: 260, y1: 70 }, { color: 'green', width: 5 });

//            drawLine(ctx, { x: 70, y: 240, x1: 160, y1: 120 }, { color: 'blue' });

            drawLine(ctx, { x: 0, y: 3, x1: imageWidth, y1: 3 }, { color: 'green', width: 5 });
            drawLine(ctx, { x: 3, y: 0, x1: 3, y1: imageHeight }, { color: 'green', width: 5 });
            drawLine(ctx, { x: 0, y: imageHeight-3, x1: imageWidth, y1: imageHeight-3 }, { color: 'green', width: 5 });
            drawLine(ctx, { x: imageWidth-3, y: 0, x1: imageWidth-3, y1: imageHeight}, { color: 'green', width: 5 });

        }, [resolution]
    );
    const drawLine = (context, info, style = {}) => {
        const { x, y, x1, y1 } = info;
        const { color = 'black', width = 1 } = style;

        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineWidth = width;
        context.stroke();
    }

/*
    var sendBase64ToServer = function(base64) {
        var httpPost = new XMLHttpRequest(),
        path = "http://127.0.0.1:8080/uploadImage",
        data = JSON.stringify({image: base64});
        httpPost.onreadystatechange = function(err) {
            if (httpPost.readyState == 4 && httpPost.status == 200){
                console.log(httpPost.responseText);
            } else {
                console.log(err);
            }
        };
        // Set the content type of the request to json since that's what's being sent
        httpPost.setHeader('Content-Type', 'application/json');
        httpPost.open("POST", path, true);
        httpPost.send(data);
    };
    var uploadImage = function(data, type){
        sendBase64ToServer(data);
    };
*/
    function capture() {
        console.log("Capture");
        var canvas = canvasRef.current.getContext("2d");
        const imageWidth  = videoRef.current.videoWidth;
        const imageHeight = videoRef.current.videoHeight;
        canvasRef.current.width = imageWidth;
        canvasRef.current.height = imageHeight;
        canvas.drawImage(
            videoRef.current,
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
        );
        overlayRef.current.height = videoRef.current.videoHeight;
        overlayRef.current.width = videoRef.current.videoWidth;
        setResolution([imageWidth, imageHeight]);

        const img = canvasRef.current.toDataURL('image/png');
//        console.log(img);
        axios({
            method: "post",
            mode: 'no-cors',
            crossDomain: 'true',
            url: "https://10.0.0.68:8080/uploadImage",
//            url: "https://localhost:8080/uploadImage",
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
                "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS"
            },
            withCredentials: false,
            credentials: 'same-origin',
            data: {
                image: img
            }
        });
    }

    function tick() {


//            console.log('tick');

//            var videoElement = document.getElementById("video")
            console.log(videoRef.current.videoHeight.toString() + "x" + videoRef.current.videoWidth);
            const imageWidth  = videoRef.current.videoWidth;
            const imageHeight = videoRef.current.videoHeight;
            canvasRef.current.height = imageWidth;
            canvasRef.current.width = imageHeight;
 //          console.log("Resolution changed " + imageWidth.toString() + "x" + imageHeight.toString());

/*
            if (image) {
                const str = image.toDataURL();
                console.log(str);
            }
*/
//            uploadImage(image, "image/png");
/*
            axios({
                method: "post",
                mode: 'no-cors',
                url: "https://10.0.0.68:8080/uploadImage",
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS"
                },
                withCredentials: true,
                credentials: 'same-origin'
            });
*/
//            console.log(image);

            var ctx = canvasRef.current.getContext("2d");
            ctx.drawImage(
                videoRef.current,
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
            );
            /*
            const str = canvasRef.toDataURL();
            console.log(str);
            var imageData = ctx.getImageData(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
            );
            BarcodeReader({
                image: imageData,
//                barcode: 'code-2of5',
                barcode: 'coda-128',
                options: {}
            }).then(code => {
                console.log('['+code+']');
            }).catch(err => {
                console.log(err);
            })
            */
            /*
            var code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });
            if (code) {
                console.log(code.data);
                setResult({ data: code.data, time: new Date() });
            }
            */
            return;
    }
/*
        <div>
                <canvas id="canvas" className="canvas" ref={canvasRef} width={640} height={480}></canvas>
                <Webcam id="webcam" ref={webcamRef} screenshotFormat="image/png" width={640} height={480}
                    videoConstraints={videoConstraints}
                />
            <div>Test 2</div>
        </div>
*/

    return (
        <div>
            <canvas id="canvas" className="canvas" ref={canvasRef} hidden/>
            <video ref={videoRef}/>
            <canvas id="overlay" className="overlay" ref={overlayRef}/>
            <div id="text">Test 0</div>
            <button id="button" type="button" onClick={() => capture()}> Capture </button>
        </div>
    );
}

export default Reader;
