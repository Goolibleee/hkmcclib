import { useEffect, useState } from "react";
import { SEARCH_PER_SCREEN } from "./Util";
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

function doNothing() {
    console.log("Do nothing...");
}

var showCallback = doNothing;
function ListView(props) {
        const [itemList, setItemList] = useState([]);
//        const [showCallback, setShowCallback] = useState(doNothing);
        const [pageNum, setPageNum] = useState(0);
        const [displayList, setDisplayList] = useState([]);

    useEffect(function () {
        console.log("Init List View");
    }, []);

    useEffect(function () {
//        console.log("Set Item List");
        setItemList(props.list);
    }, [props.list]);

    useEffect(function () {
        setPageNum(0);
    }, [props.keyValue]);

    useEffect(function () {
        if (props.showCallback)
        {
//            console.log("Set show callback");
 //           setShowCallback(props.showCallback);
            showCallback = props.showCallback;
        }
    }, [props.showCallback]);

    useEffect(function () {
        const length = itemList.length;
 //       console.log("Page num " + pageNum.toString());
        if (length > SEARCH_PER_SCREEN)
        {
            const startIdx = pageNum * SEARCH_PER_SCREEN;
            const count = Math.min(SEARCH_PER_SCREEN, length - startIdx);
            setDisplayList(itemList.slice(startIdx,startIdx+count));
        }
        else
        {
            setDisplayList(itemList)
        }
    }, [itemList, pageNum]);

    function movePrev() {
        console.log("Prev");
        if (pageNum > 0)
        {
            setPageNum(pageNum - 1);
        }
    }

    function moveNext() {
        console.log("Next");
        if (itemList.length > (pageNum + 1) * SEARCH_PER_SCREEN)
        {
            setPageNum(pageNum + 1);
        }
    }

    return (
        <div id="listView">
            {showCallback(displayList, props.detail)}
            {itemList && itemList.length > SEARCH_PER_SCREEN && (
                <div id="pageControl">
                    <div className="page" id = "page">
                        <NavigateBeforeIcon fontSize="large" sx={{color: (pageNum === 0) ? "#ffffff":"#404040"}} onClick={() => {movePrev();} }/>
                    </div>
                    <div className="pageNum" id="pageNum">
                        {pageNum+1}
                    </div>
                    <div className="page" id = "page">
                        <NavigateNextIcon fontSize="large" sx={{color: (itemList.length <= (pageNum + 1) * SEARCH_PER_SCREEN) ? "#ffffff":"#404040"}} onClick={() => {moveNext();} }/>
                    </div>
                </div>)
            }
        </div>
    );
}
export default ListView;
