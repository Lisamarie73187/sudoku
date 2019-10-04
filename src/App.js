import React, {useState }from 'react';
import './App.css';

import { List, Set, fromJS, Map } from 'immutable';
import {isColumnPeer, isPeer, isRowPeer, isSquarePeer, makePuzzle, pluck, range} from "./sudoku";
import {Cell} from "./components/Cell";
import {NumberControl} from "./components/Numbers";
import notesIcon from './assets/notes.png';
import eraseIcon from './assets/eraser.png';
import undoIcon from './assets/undo-icon.png';
import newGameIcon from './assets/newGame.png';



function App() {

    const [board, setBoard] = useState(null);
    const [history, setHistory] = useState('');
    const [solution, setSolution] = useState([]);
    const [historyOffSet, setHistoryOffSet] = useState('');
    const [notesFlag, setNotesFlag] = useState(false);


    const renderCell = (cell, x, y) => {
        const selected = getSelectedCell();
        const { value, prefilled, notes } = cell.toJSON();
        const conflict = isConflict(x, y);
        const peer = isPeer({ x, y }, board.get('selected'));
        const rowPeer = isRowPeer({x,y},board.get('selected'));
        const columnPeer = isColumnPeer({x,y},board.get('selected'));
        const squarePeer = isSquarePeer({x,y},board.get('selected'));
        const sameValue = !!(selected && selected.get('value')
            && value === selected.get('value'));

        const isSelected = cell === selected;
        return (
            <Cell
                prefilled={prefilled}
                notes={notes}
                sameValue={sameValue}
                isSelected={isSelected}
                isPeer={peer}
                rowPeer={rowPeer}
                columnPeer={columnPeer}
                squarePeer={squarePeer}
                value={value}
                onClick={() => { selectCell(x, y); }}
                key={y}
                x={x}
                y={y}
                conflict={conflict}
            />
        );
    };

    const renderNumberAndActionControl = () => {
        const selectedCell = getSelectedCell();
        const prefilled = selectedCell && selectedCell.get('prefilled');
        return (
                <div className="controls-wrapper">
                    <div>
                        {range(9).map((i) => {
                            const number = i + 1;
                            // handles binding single click and double click callbacks
                            const clickHandle = getClickHandler(
                                () => { fillNumber(number); },
                                () => { addNumberAsNote(number); },
                            );
                            return (
                                <NumberControl
                                    key={number}
                                    number={number}
                                    notesFlag={notesFlag}
                                    onClick={!prefilled ? clickHandle : undefined}
                                />);
                        })}
                    </div>
                    <div className="actions">
                        <div className="action-notes" onClick={!prefilled ? () => setNotesFlag(!notesFlag) : null}>
                            <div className='notesOnOff'> {notesFlag ? 'on' : 'off'}</div>
                            <img src={notesIcon} alt="notes-icon" height={58} width={48}/>
                            <div>Notes</div>
                        </div>
                        <div className="action-erase" onClick={!prefilled ? eraseSelected : null}>
                            <img src={eraseIcon} alt="erase-icon" height={50} width={50}/>
                            <div>Erase</div>
                        </div>
                        <div className="action-undo" onClick={!prefilled ? undo : null}>
                            <img src={undoIcon} alt="undoIcon" height={40} width={40}/>
                            <div>Undo</div>
                        </div>
                        <div className="action-newGame" onClick={!prefilled ? newGame : null}>
                            <img src={newGameIcon} alt="newGameIcon" height={40} width={40}/>
                            <div className="newGameText">New Game</div>
                        </div>
                    </div>
                </div>
        );
    };

    const eraseSelected = () => {
        let newBoard = [];
        let selectedCell = getSelectedCell();
        const { x, y } = board.get('selected');
        if (!selectedCell) return;
        selectedCell = selectedCell.set('notes', null);
        selectedCell = selectedCell.delete('value');
        newBoard = board.setIn(['puzzle', x, y], selectedCell);
        updateBoard(newBoard);
    };

    const undo = () => {
        if (history.size) {
            setHistoryOffSet(Math.max(0, historyOffSet - 1));
            setBoard(history.get(historyOffSet));
            setHistory(history);
        }
    };

    function makeCountObject() {
        const countObj = [];
        for (let i = 0; i < 10; i += 1) countObj.push(0);
        return countObj;
    }

    const newGame = () => {
        setBoard(null);
    };

    function makeBoard({ puzzle }) {
        // create initial count object to keep track of conflicts per number value
        const rows = Array.from(Array(9).keys()).map(() => makeCountObject());
        const columns = Array.from(Array(9).keys()).map(() => makeCountObject());
        const squares = Array.from(Array(9).keys()).map(() => makeCountObject());
        const result = puzzle.map((row, i) => (
            row.map((cell, j) => {
                if (cell) {
                    rows[i][cell] += 1;
                    columns[j][cell] += 1;
                    squares[((Math.floor(i / 3)) * 3) + Math.floor(j / 3)][cell] += 1;
                }
                return {
                    value: puzzle[i][j] > 0 ? puzzle[i][j] : null,
                    prefilled: !!puzzle[i][j],
                };
            })
        ));
        return fromJS({ puzzle: result, selected: false, choices: { rows, columns, squares } });
    }


    const generateGame = (finalCount = 40) => {
        const solution = makePuzzle();
        const { puzzle } = pluck(solution, finalCount);
        const boardFirst = makeBoard({ puzzle });
        setBoard(boardFirst);
        setHistory(List.of(board));
        setHistoryOffSet(0);
        setSolution(solution);
    };


    const getSelectedCell = () => {
        const selected = board.get('selected');
        return selected && board.get('puzzle').getIn([selected.x, selected.y]);
    };

    const selectCell = (x, y) => {
        let boardOne = board.set('selected', { x, y });
        setBoard(boardOne);
    };

    const isConflict = (i, j) => {
        const { value } = board.getIn(['puzzle', i, j]).toJSON();
        if (!value) return false;
        const rowConflict =
            board.getIn(['choices', 'rows', i, value]) > 1;
        const columnConflict =
            board.getIn(['choices', 'columns', j, value]) > 1;
        const squareConflict =
            board.getIn(['choices', 'squares',
                ((Math.floor(i / 3)) * 3) + Math.floor(j / 3), value]) > 1;
        return rowConflict || columnConflict || squareConflict;
    };


    function getNumberOfGroupsAssignedForNumber(number, groups) {
        return groups.reduce((accumulator, row) =>
            accumulator + (row.get(number) > 0 ? 1 : 0), 0);
    }

    const getNumberValueCount = (number) => {
        const rows = board.getIn(['choices', 'rows']);
        const columns = board.getIn(['choices', 'columns']);
        const squares = board.getIn(['choices', 'squares']);
        return Math.min(
            getNumberOfGroupsAssignedForNumber(number, squares),
            Math.min(
                getNumberOfGroupsAssignedForNumber(number, rows),
                getNumberOfGroupsAssignedForNumber(number, columns),
            ),
        );
    };

    function updateBoardWithNumber({x, y, number, fill = true, board}) {
        let cell = board.get('puzzle').getIn([x, y]);
        cell = cell.delete('notes');
        cell = fill ? cell.set('value', number) : cell.delete('value');
        const increment = fill ? 1 : -1;
        // update the current group choices
        const rowPath = ['choices', 'rows', x, number];
        const columnPath = ['choices', 'columns', y, number];
        const squarePath = ['choices', 'squares',
            ((Math.floor(x / 3)) * 3) + Math.floor(y / 3), number];
        return board.setIn(rowPath, board.getIn(rowPath) + increment)
            .setIn(columnPath, board.getIn(columnPath) + increment)
            .setIn(squarePath, board.getIn(squarePath) + increment)
            .setIn(['puzzle', x, y], cell);
    }



    // fill currently selected cell with number
    const fillNumber = (number) => {
        let newBoard = [];
        const selectedCell = getSelectedCell();
        // no-op if nothing is selected
        if (!selectedCell) return;
        const prefilled = selectedCell.get('prefilled');
        // no-op if it is refilled
        if (prefilled) return;
        const { x, y } = board.get('selected');
        const currentValue = selectedCell.get('value');
        // remove the current value and update the game state
        if (currentValue) {
            newBoard = updateBoardWithNumber({
                x, y, number: currentValue, fill: false, board: board,
            });
        }
        // update to new number if any
        const setNumber = currentValue !== number && number;
        if (setNumber) {
            newBoard = updateBoardWithNumber({
                x, y, number, fill: true, board,
            });
        }
        updateBoard(newBoard);
    };


    function getClickHandler(onClick, onNotesClick, delay = 250) {
        let timeoutID = null;
        return (event) => {
            if (!timeoutID && !notesFlag) {
                timeoutID = setTimeout(() => {
                    onClick(event);
                    timeoutID = null;
                }, delay);
            }
            if(notesFlag){
                onNotesClick(event)
            }
        };
    }

    const addNumberAsNote = (number) => {
        let newBoard = [];
        let selectedCell = getSelectedCell();
        if (!selectedCell) return;
        const prefilled = selectedCell.get('prefilled');
        if (prefilled) return;
        const { x, y } = board.get('selected');
        const currentValue = selectedCell.get('value');
        if (currentValue) {
            newBoard = updateBoardWithNumber({
                x, y, number: currentValue, fill: false, board: board,
            });
        }
        let notes = selectedCell.get('notes') || Set();
        if (notes.has(number)) {
            notes = notes.delete(number);
        } else {
            notes = notes.add(number);
        }
        selectedCell = selectedCell.set('notes', notes);
        selectedCell = selectedCell.delete('value');
        newBoard = board.setIn(['puzzle', x, y], selectedCell);
        updateBoard(newBoard);
    };

    const updateBoard = (newBoard) => {
        let newHistory = history.slice(0, historyOffSet + 1);
        newHistory = history.push(newBoard);
        setBoard(newBoard);
        setHistory(newHistory);
        setHistoryOffSet(history.size - 1);
    };

    return (
        <div>
            {!board &&
                <div className="startWrapper">
                    <div className="letsPlay">Let's Play</div>
                    <div className="levelWrapper">
                        <div className="levels" onClick={() => generateGame(40)}>
                            Easy
                        </div>
                        <div className="levels" onClick={() => generateGame(35)}>
                            Medium
                        </div>
                        <div className="levels" onClick={() => generateGame(30)}>
                            Hard
                        </div>
                        <div className="levels" onClick={() => generateGame(25)}>
                            Expert
                        </div>
                    </div>
                </div>
            }
            <div className='bodyWrapper'>
                <div className='boardWrapper'>
                {board && board.get('puzzle').map((row, i) => (
                        <div key={i} className="row">
                            {row.map((cell, j) => renderCell(cell, i, j)).toArray()}
                        </div>
                    )).toArray()
                }
                </div>
                {board && renderNumberAndActionControl()}
            </div>
        </div>
  );
}

export default App;



