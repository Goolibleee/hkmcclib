import React, { useEffect, useState } from "react";
import "./Page.css"
import { getUserState } from "../Util";
import { useLazyQuery } from "@apollo/client";
import { getBookState, toUtf8, compareRent } from "../Util";
import { Link } from 'react-router-dom'
import {USERS_QUERY, HISTORY_PERIOD_QUERY} from "../api/query.js";
import ListView from "../ListView";
import axios from "axios";
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

function RentHistory(props) {
    const [rentList, setRentList] = useState([]);
    const [initialized, setInitialized] = useState(false);
    const [fromTime, setFromTime] = useState("");
    const [toTime, setToTime] = useState("");
    const [loadUser, {loading: userLoading, data: userListData, error: userError }] = useLazyQuery(USERS_QUERY);
    const [loadHistory, {loading: historyLoading, data: historyData, error: historyError }] = useLazyQuery(HISTORY_PERIOD_QUERY,
            {"variables": { "fromTime" : fromTime, "toTime": toTime}});
    const [userList, setUserList] = useState({});
    const [yearValue, setYear] = useState(0);
    const [monthValue, setMonth] = useState(0);

    useEffect(function () {
        async function initialize() {
            if (!props.doc.initialized)
            {
                console.log("Document is not ready");
                window.location.href = "/";
                return;
            }
            console.log("=======================================");
            console.log("RentHistory initialize");

            var year = document.getElementById('year')
            var month = document.getElementById('month')
            for (var i = 1; i <= 12 ; i++)
            {
                var option = document.createElement('option');
                option.text = i.toString();
                month.add(option, i);
            }
            const thisYear = new Date().getFullYear();
            const thisMonth = new Date().getMonth() + 1;
            const fromYear = 2017;

            for (var i = fromYear ; i <= thisYear ; i++)
            {
                var option = document.createElement('option');
                option.text = i.toString();
                year.add(option, i);
            }

            console.log(thisYear);
            console.log(thisMonth);
            setYear(thisYear);
            setMonth(thisMonth);
            document.getElementById('year').value = thisYear;
            document.getElementById('month').value = thisMonth;

            if (props.doc.serverAvailable)
            {
                updateDoc();
            }
            else
            {
                console.log("Load users");
                loadUser();
                search();
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
                var list = [];
                console.log("User list available");
                for (let i = 0; i < userListData.users.length; i++)
                {
                    const user = userListData.users[i];
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
            console.log("History update")

            if (!historyData)
                return

            console.log(historyData.rentLogs)

            const books = historyData.rentLogs;
            let results = [];
            let retDate = "";
            for (let i = 0 ; i < books.length ; i++)
            {
                const book = books[i];
                const state = book.book_state;
                if (state !== "1")
                    continue
                const bookId = book.book_id;
                const userId = book.user_id;
                var userName;
                if (userList && userId in userList)
                    userName = userList[userId].name;
                else
                    userName = ""
                var bookInfo;
                if (bookId in props.doc.book)
                {
                    bookInfo = props.doc.book[bookId];
                }
                else
                {
                    bookInfo = {}
                    bookInfo.author = ""
                    bookInfo.totalName = ""
                    bookInfo.claim_num = ""
                    bookInfo.publish = ""
                    bookInfo.title = ""
                }
                const resultString = `${bookInfo.title} ${bookInfo.claim_num}`;
                if ("return_data" in book)
                {
                    retDate = book.return_data;
                }
                let resultObject = {
                    index: i,
                    text: resultString,
                    title: bookInfo.title,
                    id: bookId,
                    rentDate: book.timestamp,
                    retDate: retDate,
                    author: bookInfo.author,
                    claim_num: bookInfo.claim_num,
                    publish: bookInfo.publisher,
                    claim: bookInfo.claim,
                    user: userId,
                    userName: userName
                };
                results.push(resultObject);
            }
            results.sort(compareRent);
            console.log(results);
            setRentList(results);
        },
        [historyData, historyLoading, historyError]
    );

    useEffect(
        () => {
            updateDoc();
        }, [userList]
    );

    function compare(a1, a2)
    {
        if (a1.rentDate > a2.rentDate)
            return true;
        else if (a1.rentDate < a2.rentDate)
            return false;
        return a1.title > a2.title;
    }

    async function updateDoc()
    {
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
                        <td colSpan="3" className="bookCell">{bookName}</td>
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
                        <th id="returnDate">{props.text.returnDate}</th>
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
    function setProperty(index, value)
    {
        console.log(index);
        console.log(value);
        switch (index)
        {
            case 0:
                setYear(value);
                break;
            case 1:
                setMonth(parseInt(value));
                break;
            default:
                break;
        }
    }

    const search = async () =>
    {
        console.log("Search")
        var query;
        query = yearValue.toString() + "-" + monthValue.toString().padStart(2, "0")

        if (props.doc.serverAvailable)
        {
            const url = "https://" + props.doc.serverInfo.localIp + ":" +
                props.doc.serverInfo.port + "/history";
            const obj = {"params": {"period": query}};
            console.log(obj);
            const response = await axios.get(url, obj);
            console.log(response);

            const books = response.data.return.books;
            let results = [];
            let retDate = "";
            for (let i = 0 ; i < books.length ; i++)
            {
                const book = books[i];
                const resultString = `${book.BOOKNAME} ${book.CLAIMNUM}`;
                const state = book._STATE;
                if ("RETURN_DATE" in book)
                {
                    retDate = book.RETURN_DATE;
                }
                let resultObject = {
                    index: i,
                    text: resultString,
                    title: book.BOOKNAME,
                    id: book.BARCODE,
    //                rent: getBookState(props.text, book..toString()),
                    rentDate: book.RENT_DATE,
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
            var queryTo;
            const nextMonth = monthValue + 1
            queryTo = yearValue.toString() + "-" + nextMonth.toString().padStart(2, "0")
            setFromTime(query)
            setToTime(queryTo)
            console.log(query)
            console.log(queryTo)

            await loadHistory();

/*
            for (const index in rent)
            {
                const userId = rent[index]["user"];
                let userName;
                if (userList && userId in userList)
                    userName = userList[userId].name;
                else
                    userName = ""
                rent[index]["userName"] = userName;
                console.log("UserName " + userId + " " + index.toString() + " " + userName);
            }
            setRentList(rent);
*/
        }
    }
    function movePrev()
    {
        var year = yearValue;
        var month = monthValue;
        if (month > 1)
        {
            month -= 1
        }
        else
        {
            year -= 1;
            month = 12;
        }
        setYear(year)
        setMonth(month)
        document.getElementById('year').value = year;
        document.getElementById('month').value = month;
    }

    function moveNext()
    {
        var year = yearValue;
        var month = monthValue;
        if (month < 12)
        {
            month += 1
        }
        else
        {
            year += 1
            month = 1
        }
        setYear(year)
        setMonth(month)

        document.getElementById('year').value = year;
        document.getElementById('month').value = month;
    }

    return (
        <div id="checkOut">
            <div id="title">
                <h2>
                    {props.text.history}
                </h2>
            </div>
            <div id="searchRange">
                <div className="page" id = "page">
                    <NavigateBeforeIcon fontSize="large" sx={{color: "#404040"}} onClick={() => {movePrev();} }/>
                </div>
                <select name="year" id="year" className="dropdown" onChange={(event) => {setProperty(0, event.target.value);}}/>
                <select name="month" id="month" className="dropdown" onChange={(event) => {setProperty(1, event.target.value);}}/>
                <button id="searchButton" onClick={() => search()}> search </button>
                    <div className="page" id = "page">
                        <NavigateNextIcon fontSize="large" sx={{color: "#404040"}} onClick={() => {moveNext();} }/>
                    </div>
            </div>
            <div id="checkOutResult">
                <ListView list={rentList} showCallback={(entries) => { return showEntries(entries); }}/>

            </div>
        </div>
    );
}

export default RentHistory;
