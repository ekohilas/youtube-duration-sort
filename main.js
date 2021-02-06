const PREFIX = "evan-duration-sorter_";
const SECTION_BUTTON_ID = PREFIX + "section-button_";
const ORDER_ATTRIBUTE = PREFIX + "order";
const OrderEnum = Object.freeze({"ORIGINAL": 0, "ASCENDING": 1, "DESCENDING": 2})
const sectionsNode = document.querySelector("#contents");
const originalVideoSectionNodeMap = new Map();
const videoSectionNode = sectionsNode.children[0];

function getVideoNodeDurationInSeconds(videoNode) {
    const timeString = getVideoNodeTimeString(videoNode);
    return datetimeToSeconds(timeString);
}

function getVideoNodeTimeString(videoNode) {
    // return string is either in the format [[[h]h]h:][m]m:ss, or non existent for streams.
    const timeNode = videoNode.querySelector("#overlays > ytd-thumbnail-overlay-time-status-renderer > span");
    return timeNode ? timeNode.innerText : -1;
}

function datetimeToSeconds(timeString) {
    // timeString is expected to be in the format [[[h]h]h:][m]m:ss
    const SECONDS_IN_A_MINUTE = 60;
    const MINUTES_IN_AN_HOUR = 60;
    const SECONDS_IN_AN_HOUR = MINUTES_IN_AN_HOUR * SECONDS_IN_A_MINUTE;

    const timeList = timeString.split(":");
    let hours, minutes, seconds;
    switch (timeList.length) {
        case 3:
            hours = parseInt(timeList.shift());
            break;
        case 2: 
            hours = 0;
            break;
        case 1:
            console.log(`Couldn't parse timeString: "${timeString}"`);
            return -1;
        default:
            throw new Error(`Unknown timeString format: "${timeString}"`);
    }
    minutes = parseInt(timeList.shift());
    seconds = parseInt(timeList.shift());

    const totalSeconds = (
        hours * SECONDS_IN_AN_HOUR
        + minutes * SECONDS_IN_A_MINUTE
        + seconds
    );
    return totalSeconds;
}

function sortedVideoSectionNode(videoSectionNode, descending = false) {
    const sortedVideoSectionNode = videoSectionNode.cloneNode(true);
    const videoSectionNodeItems = sortedVideoSectionNode.querySelector("#items");
    const videoArray = Array.prototype.slice.call(videoSectionNodeItems.children);
    videoArray.sort(function(a, b) {
        if (descending) {
            return -getVideoNodeDurationInSeconds(a) + getVideoNodeDurationInSeconds(b);
        } else {
            return getVideoNodeDurationInSeconds(a) - getVideoNodeDurationInSeconds(b);
        }
    }).forEach(element => videoSectionNodeItems.appendChild(element));
    return sortedVideoSectionNode;
}

function toggleVideoSectionSort(originalVideoSectionNodeMap, videoSectionNode, order) {

    let newVideoSectionNode;
    const videoSectionNodeIndex = getChildNodeIndex(videoSectionNode);
    if (order === OrderEnum.ORIGINAL) {
        newVideoSectionNode = originalVideoSectionNodeMap.get(videoSectionNodeIndex)
            originalVideoSectionNodeMap.delete(videoSectionNodeIndex)
    } else if (order === OrderEnum.DESCENDING || order === OrderEnum.ASCENDING) {
        newVideoSectionNode = sortedVideoSectionNode(
            videoSectionNode,
            order === OrderEnum.DESCENDING
        );
        // save the original section
        if (!originalVideoSectionNodeMap.has(videoSectionNodeIndex)) {
            originalVideoSectionNodeMap[videoSectionNodeIndex] = videoSectionNode
        }
    } else {
        throw new Error(`Unknown order ${order}`);
    }
    videoSectionNode.replaceWith(newVideoSectionNode);
}

function getChildNodeIndex(childNode) {
    const parentNode = childNode.parentNode;
    return Array.prototype.indexOf.call(parentNode.children, childNode);
}

function sortButtonClicked(event) {
    const button = event.target;
    const currentOrder = button.getAttribute(ORDER_ATTRIBUTE);
    const nextOrder = (currentOrder + 1) % Object.keys(OrderEnum).length;
    const videoSectionNode = button.closest("#contents > ytd-item-section-renderer");
    button.setAttribute(ORDER_ATTRIBUTE, next);
    toggleVideoSectionSort(originalVideoSectionNodeMap, videoSectionNode, nextOrder);
}

function generateSectionButtonId(videoSectionNode) {
    const videoSectionNodeIndex = getChildNodeIndex(videoSectionNode);
    return SECTION_BUTTON_ID + videoSectionNodeIndex;
}

function addButtonToVideoSection(videoSectionNode) {
    const videoSectionHeader = sectionNode.querySelector("#title-container");
    const buttonId = generateSectionButtonId(videoSectionNode);

    // only add if doesnt have it already
    if (videoSectionHeader.querySelector("#" + buttonId) == null) {

        let button = document.createElement("div");
        button.setAttribute("id", buttonId);
        button.setAttribute(ORDER_ATTRIBUTE, OrderEnum.ORIGINAL);
        button.innerText = "🕒";

        videoSectionHeader.appendChild(button);

        button.addEventListener("onClick", sortButtonClicked);
    }
}

toggleVideoSectionSort(originalVideoSectionNodeMap, videoSectionNode, OrderEnum.DESCENDING);
