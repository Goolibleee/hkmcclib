import React, { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import "./Page.css"
import { getUserState } from "../Util";
import { useLazyQuery } from "@apollo/client";
import { compareRent } from "../Util";
import { Link, Navigate } from 'react-router-dom'
//import {USERS_QUERY, HISTORY_PERIOD_QUERY} from "../api/query.js";
import {USERS_QUERY, HISTORY_PERIOD_QUERY} from "../api/query_test.js";
import ListView from "../ListView";
import axios from "axios";
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

function RentHistory(props) {
    const [rentList, setRentList] = useState([]);
//    const [initialized, setInitialized] = useState(false);
    const [fromTime, setFromTime] = useState("");
    const [toTime, setToTime] = useState("");
    const [loadUser, {loading: userLoading, data: userListData, error: userError }] = useLazyQuery(USERS_QUERY);
    const [loadHistory, {loading: historyLoading, data: historyData, error: historyError }] = useLazyQuery(HISTORY_PERIOD_QUERY,
            {"variables": { "fromTime" : fromTime, "toTime": toTime}});
    const [userList, setUserList] = useState({});
    const [yearValue, setYear] = useState(0);
    const [monthValue, setMonth] = useState(0);
    const [query, setQuery] = useState("");
    const [searchQuery] = useDebounce(query, 300);

    useEffect(function () {
        async function initialize() {
            console.log("=======================================");
            console.log("RentHistory initialize");

            if (!props.doc.initialized)
                return;

            var i;
            var option;
            var year = document.getElementById('year')
            var month = document.getElementById('month')
            for (i = 1; i <= 12 ; i++)
            {
                option = document.createElement('option');
                option.text = i.toString();
                month.add(option, i);
            }
            const thisYear = new Date().getFullYear();
            const thisMonth = new Date().getMonth() + 1;
            const fromYear = 2017;

            for (i = fromYear ; i <= thisYear ; i++)
            {
                option = document.createElement('option');
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
                import("./PageServer.css");
//                updateDoc();
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
//                const users = userListData.users;
                const users = userListData.user_tests;
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
            console.log("History update")

            if (!historyData)
                return

//            console.log(historyData.rentLog_tests)

//            const books = historyData.rentLogs;
            const books = historyData.rentLog_tests;
            let results = [];
            let retDate = "";
            for (let i = 0 ; i < books.length ; i++)
            {
                const book = books[i];
                const state = book.book_state;
                if (state !== "1" && state !== 1)
                    continue
                if (!book.return_date || book.return_date.length === 0)
                    continue
//                console.log(book)
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
                retDate = book.return_date;
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
//            console.log(results);
            setRentList(results);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [historyData, historyLoading, historyError]
    );

/*
    useEffect(
        () => {
            updateDoc();
        }, [userList]
    );
*/

    function compare(a1, a2)
    {
        if (a1.rentDate > a2.rentDate)
            return true;
        else if (a1.rentDate < a2.rentDate)
            return false;
        return a1.title > a2.title;
    }

/*
    async function updateDoc()
    {
        setInitialized(true);
    }
*/

    const showRented = (rent, index) => {
        const id = rent["id"];
        const rentDate = rent["rentDate"];
        const retDate = rent["retDate"];
        const bookName = rent["title"];
        const claim = rent["claim"];
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
                        <td className="bookName">{claim}</td>
                        <td colSpan="2" className="bookCell">{bookName}</td>
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

    useEffect(function () {
        setQuery(yearValue.toString() + "-" + monthValue.toString().padStart(2, "0"))

    }, [yearValue, monthValue]
    );

    useEffect(function () {
        async function search()
        {
            console.log("Search")

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

                try {
                    await loadHistory();
                }
                catch (e)
                {
                    console.warn(e.name);
                }

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
        search();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [searchQuery]
    );

    function movePrev()
    {
        var year = yearValue;
        var month = monthValue;
        if (typeof year === "string")
            year = parseInt(year)
        if (typeof month === "string")
            month = parseInt(month)

        console.log(year);
        console.log(month);
        console.log(typeof year);
        console.log(typeof month);
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
        if (typeof year === "string")
            year = parseInt(year)
        if (typeof month === "string")
            month = parseInt(month)
        console.log(year);
        console.log(month);
        console.log(typeof year);
        console.log(typeof month);
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

    if (!props.doc.initialized)
        return <Navigate to="/" />;

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
                    <div className="page" id = "page">
                        <NavigateNextIcon fontSize="large" sx={{color: "#404040"}} onClick={() => {moveNext();} }/>
                    </div>
            </div>
            <div id="checkOutResult">
                <ListView keyValue={searchQuery} list={rentList} showCallback={(entries) => { return showEntries(entries); }}/>
            </div>
        </div>
    );
}

export default RentHistory;
