import React,{useState} from 'react';
import Cell from "./Cell";

function BigBox(props) {

    return (
        <div className='bigBoxWrapper'>

            {props.box.map((box,i) => {
                return (
                    <Cell number={box} indexOne={props.indexOne} indexTwo={i} getIndex={props.getIndex} setModal={props.setModal}/>
                )
            })}

        </div>
    );
}

export default BigBox;
