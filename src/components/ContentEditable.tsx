import * as React from 'react';
import {getSelectionRange, setRange, spliceString} from 'kushuh-react-utils';
import {Text, Spanner} from 'react-better-containers';
import css from './ContentEditable.module.css';

interface ChangeStats {
    target: Element | HTMLElement;
    overflows: boolean;
}

interface Props {
    innerRef?: ((instance: any) => void) | React.MutableRefObject<any> | null;
    selection?: State;
    onChange?: (value: string | number, options: ChangeStats) => (string | number | Promise<string | number>);
    maxLength?: number;
    preventPostComputing?: boolean;
    keepOverflow?: boolean;
    linear?: boolean;
    tag?: string;
    placeholderCss?: string;
    [s: string]: any;
}

interface State {
    selectionStart?: number;
    selectionEnd?: number;
}

class ContentEditable extends React.Component<Props, State> {
    ref: React.MutableRefObject<any> = typeof this.props.innerRef === 'function' ?
        React.createRef() :
        this.props.innerRef || React.createRef();

    state: State = Object.assign({
        selectionStart: 0,
        selectionEnd: 0
    }, this.props.selection || {})

    constructor(props) {
        super(props);

        this.updateHandler = this.updateHandler.bind(this);
        this.controlContent = this.controlContent.bind(this);
        this.controlSpecialKeys = this.controlSpecialKeys.bind(this);
        this.controlPaste = this.controlPaste.bind(this);
        this.controlCut = this.controlCut.bind(this);
    }

    /**
     * Updates component state.
     *
     * @param value
     * @param selectionStart
     * @param selectionEnd
     */
    updateHandler: (
        value: string,
        selectionStart: number,
        selectionEnd: number
    ) => void =
        async (
            value: string,
            selectionStart: number,
            selectionEnd: number
        ) => {
            const {onChange, maxLength, keepOverflow} = this.props;
            const overflows = value != null && value.length  > maxLength;

            if (overflows && !keepOverflow) {
                value = value.slice(0, maxLength);
            }

            if (onChange != null) {
                await onChange(value, {overflows, target: this.ref.current});
            }

            if (!this.props.preventPostComputing) {
                this.setState({selectionStart, selectionEnd});
            }
        };

    /**
     * Update content on input event.
     *
     * @param e
     */
    controlContent: (e: InputEvent) => void = (e: InputEvent) => {
        e.preventDefault();
        const {data} = e;

        /**
         * ContentEditable content is always spanned.
         */
        const {current} = this.ref;
        const target = current.childNodes[0];
        const {absolute: position} = getSelectionRange(target);

        const caretPosition = position.start === position.end ? position.start + 1 : position.start;

        const value = spliceString(target.innerText, position.start, position.end, data != null ? data.toString() : '');
        this.updateHandler(value, caretPosition, caretPosition);
    };

    /**
     * Implementation of paste method.
     *
     * @param e
     */
    controlPaste: (e: ClipboardEvent) => void = (e: ClipboardEvent) => {
        e.preventDefault();
        const data = (e.clipboardData || e.clipboardData).getData('text') || '';

        const {current} = this.ref;
        const target = current.childNodes[0];
        const {absolute: position} = getSelectionRange(target);

        const value = spliceString(target.innerText, position.start, position.end, data != null ? data.toString() : '');
        this.updateHandler(value, position.start + data.length, position.start + data.length);
    };

    /**
     * Implementation of cut method.
     *
     * @param e
     */
    controlCut: (e: ClipboardEvent) => void = (e: ClipboardEvent) => {
        e.preventDefault();

        const {current} = this.ref;
        const target = current.childNodes[0];
        const {absolute: position} = getSelectionRange(target);

        const value = spliceString(target.innerText, position.start, position.end, '');
        const selection = document.getSelection();
        e.clipboardData.setData('text/plain', selection.toString());

        this.updateHandler(value, position.start, position.start);
    };

    controlSpecialKeys: (e: KeyboardEvent) => void = (e: KeyboardEvent) => {
        const {key} = e;

        if (key === 'Backspace') {
            e.preventDefault();

            const {current} = this.ref;
            const target = current.childNodes[0];
            const {absolute: position} = getSelectionRange(target);

            console.log(position);

            if (position.end > 0) {
                const rangeLow = position.start === position.end ? position.start - 1 : position.start;
                const rangeHigh = position.start === position.end ? position.start : position.end;
                const value = spliceString(target.innerText, rangeLow, rangeHigh, '');
                const caretPosition = position.start === position.end ? position.start - 1 : position.start;

                this.updateHandler(value, caretPosition, caretPosition);
            }
        }
    };

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) {
        const {selectionStart, selectionEnd} = this.state;

        setRange(
            this.ref.current,
            selectionStart,
            selectionEnd
        );
    }

    render() {
        const {
            placeholder,
            className,
            innerRef,
            onChange,
            children,
            placeholderCss,
            linear,
            maxLength,
            tag,
            ...props
        } = this.props;

        return (
            <Text
                tag={tag || 'div'}
                onBeforeInput={this.controlContent}
                onPaste={this.controlPaste}
                onCut={this.controlCut}
                onKeyDown={this.controlSpecialKeys}
                suppressContentEditableWarning
                contentEditable
                className={`${linear ? css.linearContainer : css.container} ${className}`}
                ref={
                    typeof this.props.innerRef === 'function' ?
                        node => {
                            // @ts-ignore
                            innerRef(node);
                            this.ref = {current: node};
                        } : this.ref
                }
                {...props}
            >
                <span children={children}/>
                {
                    children != null &&
                    // @ts-ignore
                    (['Array', 'String'].includes(children.constructor.name) ? children.length > 0 : true) ?
                        // @ts-ignore
                        null :
                        <Text tag='div' className={`${css.placeholder} ${placeholderCss}`} children={placeholder}/>
                }
            </Text>
        );
    }
}

/**
 * Keep parent ref consistent, if any.
 */
export default (
    React.forwardRef(
        (
            props: Props,
            ref: ((instance: any) => void) | React.MutableRefObject<any> | null | undefined
        ) => <ContentEditable innerRef={ref} {...props}/>
    )
);