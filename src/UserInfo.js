import { useEffect, useState } from "react";
import axios from "axios";
import { toUtf8 } from "./Util";
import "./UserInfo.css";

function UserInfo(props) {
    const [needConfirm, setNeedConfirm] = useState(false);
    const [disabled, setDisabled] = useState(true);
    const [userInfo, setUserInfo] = useState({});

    useEffect(function() {
        console.log("User Info");
        console.log(props.info);
        document.getElementById('userName').value = props.info.USER_NAME;
        document.getElementById('phone').value = props.info.PHONE_NUMBER;
        document.getElementById('email').value = props.info.EMAIL;
        document.getElementById('address').value = props.info.ADDRESS;
        document.getElementById('notice_').value = props.info.NOTICE;
        document.getElementById('user_level').value = props.info.USER_LEVEL;
        setUserInfo({"USER_CODE": props.info.USER_CODE});
        setDisabled(true);

    }, [props.info]);

    function setProperty(index, value)
    {
        console.log(index);
        console.log(value);
        var info = userInfo;
        switch (index)
        {
        case 0:
            info.USER_NAME = value;
            break;
        case 1:
            info.PHONE_NUMBER = value;
            break;
        case 2:
            info.EMAIL = value;
            break;
        case 3:
            info.ADDRESS = value;
            break;
        case 4:
            info.USER_LEVEL = value;
            break;
        case 5:
            info.NOTICE = value;
            break;
        default:
            break;
        }
        const length = Object.keys(info).length;
        console.log(length);
//        if (length >= 1 && "USER_LEVEL" in info && info.USER_LEVEL >= 0 && info.USER_LEVEL <= 2)
        if (length > 1)
            setDisabled(false);
        setUserInfo(info);
    }

    function confirmAction()
    {
        console.log("Save modification");
        console.log(userInfo);
        const ipAddr = props.doc.serverInfo.localIp;
        const portNum = props.doc.serverInfo.port;
        if (ipAddr.length === 0 || portNum <= 0)
            return;

        const url = "https://" + ipAddr + ":" +
            portNum + "/user";

        var obj = {};
        for (const key in userInfo)
        {
            obj[key] = btoa(toUtf8(userInfo[key]));
        }
        axios.post(url, obj).then( response => {
            console.log(response);
            props.refresh(response);
        });
        setNeedConfirm(false);
    }

    function cancelAction()
    {
        setNeedConfirm(false);
    }

    return (
        <div>
            <table><tbody>
                <tr key="Name">
                    <td> {props.text.name} </td>
                    <td colSpan="3">
                        <input type="text" className="input" id="userName" onChange={(event) => {setProperty(0, event.target.value);}} />
                    </td>
                </tr>
                {"REG_DATE" in props.info &&
                    <tr key="Register">
                        <td> {props.text.registeredDate} </td>
                        <td colSpan="3" className="data">
                            {props.info.REG_DATE}
                        </td>
                    </tr>
                }
                <tr key="Phone">
                    <td> {props.text.phone} </td>
                    <td colSpan="3">
                        <input type="text" className="input" id="phone" onChange={(event) => {setProperty(1, event.target.value);}} />
                    </td>
                </tr>
                <tr key="Email">
                    <td> {props.text.email} </td>
                    <td colSpan="3">
                        <input type="text" className="input" id="email" onChange={(event) => {setProperty(2, event.target.value);}} />
                    </td>
                </tr>
                <tr key="Address">
                    <td> {props.text.address} </td>
                    <td colSpan="3">
                        <input type="text" className="input" id="address" onChange={(event) => {setProperty(3, event.target.value);}} />
                    </td>
                </tr>
                <tr key="Notice">
                    <td> {props.text.notice_} </td>
                    <td colSpan="3">
                        <input type="text" className="input" id="notice_" onChange={(event) => {setProperty(5, event.target.value);}} />
                    </td>
                </tr>
                <tr key="Level">
                    <td> {props.text.level} </td>
                    <td colSpan="3" className="cell">
                        <select name="User Level" id="user_level" className="dropdown" onChange={(event) => {setProperty(4, event.target.value);}}>
                            <option value="0"> {props.text.kid} </option>
                            <option value="1"> {props.text.adult} </option>
                            <option value="2"> {props.text.admin} </option>
                        </select>
                    </td>
                </tr>
            </tbody></table>
           <button id="modify" hidden={needConfirm} onClick={async () => setNeedConfirm(true)} disabled={disabled}> {props.text.save} </button>
            <div id="checkModify" hidden={!needConfirm}>
                <div id="noticeMsg"> {props.text.confirmSave} </div>
                <button id="confirm" onClick={() => confirmAction()}> {props.text.confirm} </button>
                <button id="cancel" onClick={() => cancelAction()}> {props.text.cancel} </button>
            </div>
        </div>
    );
}
export default UserInfo;
