import React, { useEffect } from "react";
import { Link } from 'react-router-dom'
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

    if (!props.doc.serverAvailable)
    {
        return (<div id="home" dangerouslySetInnerHTML={{__html:props.text.homeText}}></div>);
    }
    else
    {
        import("./PageServer.css");
        return (<div id="home">
                    <Link className='home-items' to="/checkOut">
                        {props.text.checkOut}
                    </Link>
                    <Link className='home-items' to="/return">
                        {props.text.return}
                    </Link>
                </div>);
    }
}

export default Home;
