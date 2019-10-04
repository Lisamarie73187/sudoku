import React from "react";

export const NumberControl = ({ number, onClick, notesFlag }) => (
    <div
        key={number}
        className={notesFlag ? "number-notes" : "number"}
        onClick={onClick}
    >
        <div>{number}</div>
    </div>
);