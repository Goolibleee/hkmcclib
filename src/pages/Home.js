import React, { useEffect } from "react";
import "./Home.css";

function Home(props) {
    useEffect(function () {
        async function initialize() {
            console.log("Home");
            props.doc.setCallback(undefined);
        }
        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (<div id="home" dangerouslySetInnerHTML={{__html:props.text.homeText}}></div>);
}

export default Home;
