import React, { useEffect } from "react";
import { toast } from "react-toastify";
import "./Home.css";
import { toastProp } from "../Util";

function Home(props) {
    useEffect(function () {
        async function initialize() {
            console.log("Home");
            if (props.doc.isOpen())
                updateDoc(false);
            else
                props.doc.setCallback(updateDoc);
        }
        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function updateDoc(notify = true)
    {
        console.log("All data loaded ");

        if (notify) {
            const prop = toastProp;
            prop.type = toast.TYPE.SUCCESS;
            prop.render = props.text.succeededToOpen;
            prop.autoClose = 3000;
            prop.toastId = "";
            toast.info(props.text.succeededToOpen, prop);
        }
        console.log("Done");
    }

    return (<div id="home" dangerouslySetInnerHTML={{__html:props.text.homeText}}></div>);
}

export default Home;
