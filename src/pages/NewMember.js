import React, { useEffect, useState, useRef } from "react";
import "./Page.css"
import { toast } from "react-toastify";
import { useDebounce } from "use-debounce";
import { toastProp, MAX_SEARCH_ENTRY, getUserState, toUtf8 } from "../Util";
import { useLazyQuery } from "@apollo/client";
import { Link, useParams } from 'react-router-dom'
import {USERS_QUERY} from "../api/query.js";
import ListView from "../ListView";
import UserInfo from "../UserInfo";
import axios from "axios";

//var rentList = [];

function NewMember(props) {
    const [userText, setUserText] = useState("");
    const [userInfo, setUserInfo] = useState({});
    const [searchQuery] = useDebounce(userText, 50);
    const [queryRequest, toggleQueryRequest] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [initialized, setInitialized] = useState(false);
    const [loadUser, {loading: userLoading, data: userListData, error: userError }] = useLazyQuery(USERS_QUERY);
    const [userList, setUserList] = useState({});
    const [selectedId, setSelectedId] = useState(0);
    const selectedRef = useRef("0");
    const { id } = useParams();
    const [rentList, setRentList] = useState([]);

    useEffect(function () {
        async function initialize() {
            if (!props.doc.initialized || !props.doc.serverAvailable)
            {
                console.log("Document is not ready");
                window.location.href = "/";
                return;
            }
            console.log("=======================================");
            console.log("NewMember initialize");
            prepareNewMember();
        }

        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        () => {
            console.log("Updated id: " + id);
            if (id)
            {
                setUserText(id);
            }
            else
            {
                setUserText("");
            }
        }, [id]
    );

    function prepareNewMember()
    {
        var info = {};
        info.USER_CODE = "";
        info.USER_NAME = "";
        info.PHONE_NUMBER = "";
        info.EMAIL = "";
        info.ADDRESS = "";
        info.NOTICE = "";
        info.USER_LEVEL = -1;
        setUserInfo(info);
    }

    useEffect(
        () => {
            console.log("User list loaded");
            console.log(userError);
            console.log(userLoading);
            if (userListData)
            {
                var list = [];
                console.log("User list available");
                for (let i = 0; i < userListData.users.length; i++)
                {
                    const user = userListData.users[i];
                    const entry = {"id": user._id, "name": user.name, "level": user.level, "state": getUserState(props.text, user.state)};
                    list.push(entry)
                }
                console.log(list);
                props.doc.setUser(list);
                console.log(props.doc.getUser());
                setUserList(props.doc.getUser());
            }
        },
        [userListData, userLoading, userError, props]
    );

    function refresh(response)
    {
        console.log("Refresh page " + queryRequest);
        console.log(response)
        toggleQueryRequest(!queryRequest);

        const prop = toastProp;
        var text
        if (response.data.return === "OK")
        {
            prop.type = toast.TYPE.SUCCESS;
            text = props.text.logInSucceed;
            prepareNewMember()
        }
        else
        {
            prop.type = toast.TYPE.ERROR;
            text = props.text.logInFail;
        }
        prop.autoClose = 3000;
        toast.info(text, prop);
    }

    return (
        <div id="checkOut">
            <div id="title">
                <h2>
                    {props.text.newMember}
                </h2>
            </div>
            <div id="checkOutInput" hidden={!props.doc.admin}>
                {props.doc.serverAvailable &&
                    <UserInfo text={props.text} doc={props.doc} info={userInfo} refresh={refresh}/>
                }
            </div>
        </div>
    );
}

export default NewMember;
