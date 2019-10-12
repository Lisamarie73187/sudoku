import {range} from "../sudoku";
import React from "react";

export const Cell = (props) => {
    const {value, onClick, isPeer, rowPeer, columnPeer, squarePeer, isSelected, sameValue, prefilled, notes, conflict} = props;

    const renderBackgroundColor = () => {
            if(conflict && isPeer && sameValue) return {backgroundColor: 'rgba(245, 3, 0, 0.73)'};
            if(sameValue) return {backgroundColor: 'rgba(113, 73, 245, 0.58)'};
            if(isSelected) return {backgroundColor: "rgba(248, 211, 74, 0.96)"};
            if(squarePeer) return {backgroundColor: "rgba(248, 219, 78, 0.57)"};
            if(rowPeer || columnPeer) return {backgroundColor: "rgba(95, 212, 246, 0.78)"};
    };



    return (
        <div className="box" style={renderBackgroundColor()} onClick={onClick}>
            {
                notes ?
                    range(9).map(i =>
                        (
                            <div key={i} className="notes">
                                {notes.has(i + 1) && (i + 1)}
                            </div>
                        )) :
                    value && value
            }
        </div>
    );
};