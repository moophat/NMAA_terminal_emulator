// keybindings.js

// Store the "kill buffer" for yank operations
let killBuffer = '';

export const keyBindings = {
    'Ctrl+C': (term, state) => {
        term.write('^C\r\n$ ');
        state.currentCommand = '';
        state.cursorPosition = 0;
    },
    'Ctrl+Z': (term, state) => {
        term.write('^Z\r\n$ ');
        state.currentCommand = '';
        state.cursorPosition = 0;
    },
    'Ctrl+A': (term, state) => {
        state.cursorPosition = 0;
        updateTerminalDisplay(term, state);
    },
    'Ctrl+E': (term, state) => {
        state.cursorPosition = state.currentCommand.length;
        updateTerminalDisplay(term, state);
    },
    'Ctrl+B': (term, state) => {
        if (state.cursorPosition > 0) {
            state.cursorPosition--;
            updateTerminalDisplay(term, state);
        }
    },
    'Ctrl+F': (term, state) => {
        if (state.cursorPosition < state.currentCommand.length) {
            state.cursorPosition++;
            updateTerminalDisplay(term, state);
        }
    },
    'Alt+B': (term, state) => {
        const leftPart = state.currentCommand.slice(0, state.cursorPosition);
        const newLeftPart = leftPart.replace(/\w+\s*$/, '');
        state.cursorPosition = newLeftPart.length;
        updateTerminalDisplay(term, state);
    },
    'Alt+F': (term, state) => {
        const rightPart = state.currentCommand.slice(state.cursorPosition);
        const match = rightPart.match(/^\w+\s*/);
        if (match) {
            state.cursorPosition += match[0].length;
            updateTerminalDisplay(term, state);
        }
    },
    'Ctrl+D': (term, state) => {
        if (state.cursorPosition < state.currentCommand.length) {
            state.currentCommand = state.currentCommand.slice(0, state.cursorPosition) + state.currentCommand.slice(state.cursorPosition + 1);
            updateTerminalDisplay(term, state);
        }
    },
    'Ctrl+H': (term, state) => {
        if (state.cursorPosition > 0) {
            state.currentCommand = state.currentCommand.slice(0, state.cursorPosition - 1) + state.currentCommand.slice(state.cursorPosition);
            state.cursorPosition--;
            updateTerminalDisplay(term, state);
        }
    },
    'Ctrl+W': (term, state) => {
        const leftPart = state.currentCommand.slice(0, state.cursorPosition);
        const newLeftPart = leftPart.replace(/\w+\s*$/, '');
        killBuffer = leftPart.slice(newLeftPart.length);
        state.currentCommand = newLeftPart + state.currentCommand.slice(state.cursorPosition);
        state.cursorPosition = newLeftPart.length;
        updateTerminalDisplay(term, state);
    },
    'Alt+D': (term, state) => {
        const rightPart = state.currentCommand.slice(state.cursorPosition);
        const match = rightPart.match(/^\w+\s*/);
        if (match) {
            killBuffer = match[0];
            state.currentCommand = state.currentCommand.slice(0, state.cursorPosition) + rightPart.slice(match[0].length);
            updateTerminalDisplay(term, state);
        }
    },
    'Ctrl+U': (term, state) => {
        killBuffer = state.currentCommand.slice(0, state.cursorPosition);
        state.currentCommand = state.currentCommand.slice(state.cursorPosition);
        state.cursorPosition = 0;
        updateTerminalDisplay(term, state);
    },
    'Ctrl+K': (term, state) => {
        killBuffer = state.currentCommand.slice(state.cursorPosition);
        state.currentCommand = state.currentCommand.slice(0, state.cursorPosition);
        updateTerminalDisplay(term, state);
    },
    'Ctrl+Y': (term, state) => {
        if (killBuffer) {
            state.currentCommand = state.currentCommand.slice(0, state.cursorPosition) + killBuffer + state.currentCommand.slice(state.cursorPosition);
            state.cursorPosition += killBuffer.length;
            updateTerminalDisplay(term, state);
        }
    },
    'Ctrl+L': (term) => {
        term.clear();
        term.write('$ ');
    },
    'ArrowUp': (term, state) => {
        if (state.historyIndex > 0) {
            state.historyIndex--;
            state.currentCommand = state.history[state.historyIndex];
            state.cursorPosition = state.currentCommand.length;
            updateTerminalDisplay(term, state);
        }
    },
    'ArrowDown': (term, state) => {
        if (state.historyIndex < state.history.length - 1) {
            state.historyIndex++;
            state.currentCommand = state.history[state.historyIndex];
            state.cursorPosition = state.currentCommand.length;
            updateTerminalDisplay(term, state);
        } else {
            state.historyIndex = state.history.length;
            state.currentCommand = '';
            state.cursorPosition = 0;
            updateTerminalDisplay(term, state);
        }
    },
    'ArrowLeft': (term, state) => {
        if (state.cursorPosition > 0) {
            state.cursorPosition--;
            updateTerminalDisplay(term, state);
        }
    },
    'ArrowRight': (term, state) => {
        if (state.cursorPosition < state.currentCommand.length) {
            state.cursorPosition++;
            updateTerminalDisplay(term, state);
        }
    }
};

// Helper function to update the terminal display
export const updateTerminalDisplay = (term, state) => {
    term.write('\x1b[2K\r$ ' + state.currentCommand);
    // Set cursor position to reflect prompt offset
    term.write('\x1b[' + (state.cursorPosition + 3) + 'G');
};
