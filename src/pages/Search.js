import React, { useEffect, useState, useRef } from "react";
import "./Page.css"
import { useDebounce } from "use-debounce";
import { MAX_SEARCH_ENTRY, getBookState, toUtf8 } from "../Util";
import { useParams } from "react-router-dom";
import axios from "axios";
import ListView from "../ListView";

let initialized = false;

function Search(props) {
    const [inputText, setInputText] = useState("");
    const [searchQuery] = useDebounce(inputText, 50);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedId, setSelectedId] = useState(0);
    const selectedRef = useRef("0");

    const [bookList, setBookList] = useState([]);
    const [rentList, setRentList] = useState([]);

    const { id } = useParams();

    useEffect(function () {
        async function initialize() {
            if (props.doc.isOpen())
                updateDoc();
            else
                props.doc.setCallback(updateDoc);
            console.log("BOOK ID: " + id);
        }
        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        () => {
            console.log("Updated id: " + id);
            if (id)
            {
                setInputText(id);
            }
            else
            {
                setInputText("");
            }
        }, [id]
    );

    useEffect(
        () => {
            async function findBooks(text) {
                let results = [];

                if (props.doc.serverAvailable)
                {
                    console.log(toUtf8(text));
                    console.log(btoa(toUtf8(text)));
                    const url = "https://" + props.doc.serverInfo.localIp + ":" +
                        props.doc.serverInfo.port + "/book";
                    const obj = {"params": {"book": btoa(toUtf8(text)), "match":false}};
                    console.log(obj);
                    const response = await axios.get(url, obj);
                    console.log(response)
                    if (!("books" in response.data.return))
                        return results;
                    const books = response.data.return.books;
                    let retDate = "";
                    for (let i = 0 ; i < books.length ; i++)
                    {
                        const book = books[i];
                        const resultString = `${book.BOOKNAME} ${book.CLAIMNUM}`;
                        const state = book._STATE;
                        if (state === 1 || state === 3)
                        {
                            retDate = props.text.returnDate + " " + book._RETURN;
                        }
                        let resultObject = {
                            index: i,
                            text: resultString,
                            name: book.BOOKNAME,
                            code: book.BARCODE,
                            rent: getBookState(props.text, book._STATE.toString()),
                            retDate: retDate,
                            author: book.AUTHOR,
                            totalName: book.TOTAL_NAME,
                            claim_num: book.CLAMENUM,
                            publish: book.PUBLISH,
                            claim: book.CLAIM
                        };
                        results.push(resultObject);
                    }
                }
                else
                {

                    for (let i = 0 ; i < bookList.length ; i++) {
                        const row = bookList[i];
                        if (results.length >= MAX_SEARCH_ENTRY) break;
                        if ((row.name && row.name.toString().includes(text)) ||
                            (row.code === text))
                        {
                            let resultString = `${row.name} ${row.claim_num}`;
                            let retDate = "";
                            let state = "0";
                            for (const entry of rentList)
                            {
                                if (entry.code === row.code)
                                {
                                    state = entry.state;
                                    if (state === "1" || state === "3")
                                    {
                                        retDate = props.text.returnDate + " " + entry.retDate;
                                    }
                                    break;
                                }
                            }
                            let resultObject = {
                                index: i,
                                text: resultString,
                                name: row.name,
                                code: row.code.toString(),
                                rent: getBookState(props.text, state),
                                retDate: retDate,
                                author: row.author,
                                totalName: row.totalName,
                                claim_num: row.claim_num,
                                publish: row.publish,
                                claim: row.claim
                            };
                            results.push(resultObject);
                        }
                    }
                }
                results.sort(function(a,b) { return a['text'] > b['text']; });
                return results;
            }
            async function query() {
                if (searchQuery) {
                    let sr = await findBooks(searchQuery);
                    if (sr.length > 0)
                        setSearchResults(sr);
                    else
                        setSearchResults([]);
                    if (sr.length === 1)
                        selectedRef.current = sr[0].code;
                } else {
                    setSearchResults([]);
                }
            }
            query();
        },
        [searchQuery, bookList, rentList, props]
    );

    async function updateDoc()
    {
        console.log("All data loaded " + initialized);
        initialized = true;

        let rl = [];
        const rented = props.doc.rent;
        for (let i = 0 ; i < rented.length; i++)
        {
           rl.push({code:rented[i].book_id, retDate:rented[i].return_date, state:rented[i].state});
        }
        setRentList(rl);

        let bl = [];
        const books = props.doc.book
        for (const key in books)
        {
           const book = books[key];
           bl.push({code: book._id, name: book.title, num: book.num, author: book.author, claim: book.claim,
                    claim_num: book.claim_num, totalName: book.series, category: book.publisher, publish: book.publisher});
        }
        console.log("Load");
        console.log(books.length);
        setBookList(bl);
    }

    const selectId = async (code) => {
        console.log("Prev " + selectedRef.current);
        if (selectedRef.current === -1 || selectedRef.current !== code)
        {
            console.log("Select " + code);
            setSelectedId(code);
            selectedRef.current = code;
        }
        else
        {
            console.log("Deselect " + code);
            setSelectedId(-1);
            selectedRef.current = -1;
        }
    }

    const showEntry = (result) => {
        const hidden = (result.code !== selectedRef.current);
        const entryId = (hidden) ? "searchResult" : "selectedSearchResult";
        return (
            <div key={result.code}>
            <div id={entryId} onClick={async () => await selectId(result.code)}>
                <table><tbody>
                    <tr className="searchTr">
                        <td className="searchTitle"> {result.text}</td>
                        <td className="searchRent"> {result.rent} </td>
                    </tr>
                </tbody></table>
            </div>
            {!hidden &&
            <div>
                <table><tbody>
                <tr>
                    <td>{result.author} </td>
                    <td colSpan="2" rowSpan="2">{result.totalName} <b>{result.name}</b> { result.claim_num} </td>
                </tr>
                <tr>
                    <td>{result.code} </td>
                </tr>
                <tr>
                    <td>{result.publish}</td>
                    <td colSpan={result.retDate.length > 0 ? "1":"2"}>{result.claim} </td>
                    {result.retDate.length > 0 && <td>{result.retDate}</td> }
                </tr>
                </tbody></table>
            </div>
            }
            </div>
        );
    }

    function showEntries(results)
    {
        return results.map((result) => showEntry(result))
    }

    return (
        <div id="search">
            <div id="title">
                <h2> {props.text.bookSearch} </h2>
            </div>
            <div id="searchContents">
                <input id="searchInput"
                    placeholder={props.text.searchBook}
                    value={inputText}
                    onChange={(event) => {
                        setInputText(event.target.value);
                    }} />
            </div>
            <ListView list={searchResults} showCallback={(entries) => { return showEntries(entries); }}/>
        </div>
    );
}

export default Search;
