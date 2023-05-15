import React, { useEffect, useState } from "react";
import "./Page.css"
import { toast } from "react-toastify";
import { useDebounce } from "use-debounce";
import { toastProp } from "../Util";
import { SEARCH_PER_SCREEN, MAX_SEARCH_ENTRY, getBookState, toUtf8 } from "../Util";
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useParams } from "react-router-dom";
import axios from "axios";

let initialized = false;

function Search(props) {
    const [inputText, setInputText] = useState("");
    const [searchQuery] = useDebounce(inputText, 50);
    const [searchResults, setSearchResults] = useState([]);
    const [displayedCodes, setDisplayedCodes] = useState([]);
    const [pageNum, setPageNum] = useState(0);
    const [selectedId, setSelectedId] = useState(0);

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
                    const obj = {"params": {"book": btoa(toUtf8(text)), "metch":false}};
                    console.log(obj);
                    const response = await axios.get(url, obj);
                    console.log(response)
                    const books = response.data.return;
                    let retDate = "";
                    for (let i = 0 ; i < books.length ; i++)
                    {
                        const entry = {};
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
                            let rent = props.text.available;
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
    //                        if (rentList.includes(row.code))
    //                            rent = props.text.checkedOut;
    //                        else
    //                            rent = props.text.available;
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
                        setSelectedId(sr[0].index);
                } else {
                    setSearchResults([]);
                }
                setPageNum(0);
            }
            query();
        },
        [searchQuery, bookList, rentList, props]
    );

    useEffect(
        () => {
            const length = searchResults.length;
                console.log("Page num " + pageNum.toString());
            if (length > SEARCH_PER_SCREEN)
            {
                const startIdx = pageNum * SEARCH_PER_SCREEN;
                const count = Math.min(SEARCH_PER_SCREEN, length - startIdx);
                setDisplayedCodes(searchResults.slice(startIdx,startIdx+count));
            }
            else
            {
                setDisplayedCodes(searchResults);
                setPageNum(0);
            }
        }, [searchResults, pageNum]
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

    function movePrev() {
        if (pageNum > 0)
        {
            setPageNum(pageNum - 1);
        }
    }

    function moveNext() {
        if (searchResults.length > (pageNum + 1) * SEARCH_PER_SCREEN)
        {
            setPageNum(pageNum + 1);
        }
    }

    const selectId = async (id) => {
        if (selectedId === -1 || selectedId !== id)
        {
            console.log("Select " + id);
            setSelectedId(id);
        }
        else
        {
            console.log("Deselect " + id);
            setSelectedId(-1);
        }
    }

    const showEntry = (result) => {
        const hidden = (result.index !== selectedId);
        const entryId = (hidden) ? "searchResult" : "selectedSearchResult";
        return (
            <div key={result.code}>
            <div id={entryId} onClick={async () => await selectId(result.index)}>
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

                {displayedCodes.map((result) => showEntry(result))}
            </div>
            {searchResults.length > SEARCH_PER_SCREEN && (
                <div id="pageControl">
                    <div className="page" id = "page">
                        <NavigateBeforeIcon fontSize="large" sx={{color: (pageNum === 0) ? "#ffffff":"#404040"}} onClick={movePrev}/>
                    </div>
                    <div className="pageNum" id="pageNum">
                        {pageNum+1}
                    </div>
                    <div className="page" id = "page">
                        <NavigateNextIcon fontSize="large" sx={{color: (searchResults.length <= (pageNum + 1) * SEARCH_PER_SCREEN) ? "#ffffff":"#404040"}} onClick={moveNext}/>
                    </div>
                </div>
            )}
        </div>
    );
}
//                        <NavigateBeforeIcon fontSize="large" hidden={pageNum === 0 ? "hidden":""} color="primary" onClick={movePrev}/>
//                        <NavigateBeforeIcon id="prevPage" fontSize="large" color="primary" onClick={movePrev} />
//                        {pageNum !== 0 ?
//                         <button id="prevPage" hidden onClick={movePrev}> &lt;&lt; </button> : null}

export default Search;
