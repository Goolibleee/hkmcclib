import React, { useEffect, useState } from "react";
import "./Page.css"
import { getUserState } from "../Util";
import { useLazyQuery } from "@apollo/client";
import { getBookState } from "../Util";
import { Link, Navigate } from 'react-router-dom'
import {USERS_QUERY} from "../api/query.js";
//import {USERS_QUERY} from "../api/query_test.js";
import ListView from "../ListView";
import axios from "axios";

function RentHistory(props) {
    const [rentList, setRentList] = useState([]);
    const [initialized, setInitialized] = useState(false);
    const [loadUser, {loading: userLoading, data: userListData, error: userError }] = useLazyQuery(USERS_QUERY);
    const [userList, setUserList] = useState({});

    useEffect(function () {
        async function initialize() {
            console.log("=======================================");
            console.log("RentHistory initialize");

            if (props.doc.serverAvailable)
            {
                import("./PageServer.css");
                updateDoc();
            }
            else
            {
                console.log("Load users");
                loadUser();
            }
        }

        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        () => {
            console.log("User list loaded");
            console.log(userError);
            console.log(userLoading);
            if (userListData)
            {
                const users = userListData.users;
//                const users = userListData.user_tests;
                var list = [];
                console.log("User list available");
                for (let i = 0; i < users.length; i++)
                {
                    const user = users[i];
                    const entry = {"id": user._id, "name": user.name, "level": user.level, "state": getUserState(props.text, user.state)};
                    list.push(entry)
                }
                props.doc.setUser(list);
                setUserList(props.doc.getUser());
            }
        },
        [userListData, userLoading, userError, props.doc, props.text]
    );

    useEffect(
        () => {
            updateDoc();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [userList]
    );

    function compare(a1, a2)
    {
        return a1.rentDate > a2.rentDate;
    }

    async function updateDoc()
    {
        console.log("All data loaded " + initialized);
        if (props.doc.serverAvailable)
        {
            let results = [];
            const url = "https://" + props.doc.serverInfo.localIp + ":" +
                props.doc.serverInfo.port + "/book";
            const obj = {"params": {"user": "*", "match":false}};
//            console.log(obj);
            const response = await axios.get(url, obj);
//           console.log(response)
//            if (!("books" in response.data.return))
//                return results;
            const books = response.data.return.books;
            for (let i = 0 ; i < books.length ; i++)
            {
                const book = books[i];
                const resultString = `${book.BOOKNAME} ${book.CLAIMNUM}`;
                const state = book._STATE;
                let retDate = "";
                if (state === 1 || state === 3 || state === "1" || state === "3")
                {
                    retDate = book.RETURN_DATE;
                }
                let resultObject = {
                    index: i,
                    text: resultString,
                    title: book.BOOKNAME,
                    id: book.BARCODE,
                    rent: getBookState(props.text, book.STATS.toString()),
                    rentDate: book.LENT_DATE,
                    retDate: retDate,
                    author: book.AUTHOR,
                    totalName: book.TOTAL_NAME,
                    claim_num: book.CLAMENUM,
                    publish: book.PUBLISH,
                    claim: book.CLAIM,
                    user: book.USER,
                    userName: book.USER_NAME
                };
                results.push(resultObject);
            }
            results.sort(compare);
            setRentList(results);
        }
        else
        {

            const rent = await props.doc.getRent();
            console.log("Rent");
            console.log(rent);
            rent.sort(compare);
            for (const index in rent)
            {
                const userId = rent[index]["user"];
                let userName;
                if (userList && userId in userList)
                    userName = userList[userId].name;
                else
                    userName = ""
                rent[index]["userName"] = userName;
//                console.log("UserName " + userId + " " + index.toString() + " " + userName);
            }
            setRentList(rent);
        }

        console.log("Done");
        setInitialized(true);
    }

    const showRented = (rent, index) => {
        const id = rent["id"];
        const rentDate = rent["rentDate"];
        const retDate = rent["retDate"];
        const bookName = rent["title"];
        const userId = rent["user"];
        const userName = rent["userName"];
        const key = index.toString();
        const claim = rent["claim"];
        /*
        var userName;
        if (userList && userId in userList)
            userName = userList[userId].name;
        else
            userName = ""
        */
        return (<React.Fragment key={key + "Fragment"}>
                    <tr key={key} className="bookTop">
                        <td className="bookCell"><Link to={"/search/"+id}>{id}</Link></td>
                        <td className="bookCell">{rentDate}</td>
                        <td className="bookCell">{retDate}</td>
                    </tr>
                    <tr key={key + "Title"} className="bookRow">
                        <td className="bookName">{claim}</td>
                        <td colSpan="2" className="bookName">{bookName}</td>
                    </tr>
                    <tr key={key + "Renter"} className="bookBottom">
                        <td className="bookCell"><Link to={"/userSearch/"+userId}> {userId} </Link></td>
                        <td colSpan="2" className="bookCell"> {userName} </td>
                    </tr>
                </React.Fragment>
                );
    }

    const showEntries = (result) => {
        return (<div>
                    <table><tbody>
                    <tr key="ID">
                        <th id="id">{props.text.id}</th>
                        <th id="rentDate">{props.text.rentDate}</th>
                        <th id="returnDate">{props.text.dueDate}</th>
                    </tr>
                    {
                        result &&
                        result.map((rent, index) => {
                            return showRented(rent, index);
                        })
                    }
                    {
                        result && result.length === 0 && <tr key="None"><td colSpan="3">{props.text.noEntry}</td></tr>
                    }
                    </tbody></table>
                </div>);
    }

    if (!props.doc.initialized)
        return <Navigate to="/" />;

    return (
        <div id="situation">
            <div id="title">
                <h2>
                    {props.text.situation}
                </h2>
            </div>
            <div id="checkOutResult">
                <ListView keyValue="" list={rentList} showCallback={(entries) => { return showEntries(entries); }}/>

            </div>
        </div>
    );
}

export default RentHistory;
