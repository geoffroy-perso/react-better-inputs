import * as React from 'react';
import {ChangeEvent} from 'react';
import css from './Input.module.css';
import {Text} from 'react-better-containers';

interface ChangeStats {
    event: Event | ChangeEvent | InputEvent;
    overflows: boolean;
}

interface Props extends React.ComponentProps<any> {
    innerRef?: ((instance: any) => void) | React.MutableRefObject<any> | null;
    onChange?: (value: string | number, options: ChangeStats) => (string | number | Promise<string | number>);
    preventPostComputing?: boolean;
    maxLength?: number;
    autosize?: boolean;
    [s: string]: any;
}

class Input extends React.Component<Props, {}> {
    ref: React.MutableRefObject<any> = typeof this.props.innerRef === 'function' ?
        React.createRef() :
        this.props.innerRef || React.createRef();

    /**
     * Custom onChange function.
     *
     * @param e
     */
    handleChange: (e: ChangeEvent) => Promise<string | number> = (e: ChangeEvent) => new Promise(
        async (resolve, reject) => {
            const {value, selectionStart, selectionEnd} = this.ref.current;
            const {onChange, preventPostComputing, maxLength} = this.props;

            /**
             * Limit entry value.
             */
            let overflows = false;
            let slicedValue: string | number = value;

            if (maxLength) {
                if (value && typeof value === 'string') {
                    overflows = value.length > maxLength;
                    if (overflows) {
                        slicedValue = value.slice(0, maxLength);
                    }
                } else if (value && typeof value === 'number') {
                    overflows = value > maxLength;
                    if (overflows) {
                        slicedValue = maxLength;
                    }
                }
            }

            try {
                /**
                 * Apply user onChange function to value before update.
                 */
                if (onChange != null) {
                    slicedValue = await onChange(slicedValue, {event: e, overflows});
                }

                /**
                 * Recalibrate caret position after changes.
                 */
                if (!preventPostComputing) {
                    (this.ref.current).setSelectionRange(selectionStart, selectionEnd);
                }

                resolve(slicedValue);
            } catch (error) {
                reject(error);
            }
        }
    );

    /**
     * Simulates the behavior of contenteditable div on input element.
     */
    autoSize: () => void = () => {
        const {autosize} = this.props;
        const {current} = this.ref;

        if (current) {
            if (autosize) {
                current.style.height = 'auto';
                current.style.height = current.scrollHeight + 'px';
            }
        }
    };

    componentDidMount() {
        const {autosize} = this.props;
        if (autosize != null) {
            window.addEventListener('load', this.autoSize);
            window.addEventListener('resize', this.autoSize);
            this.autoSize();
        }

    }

    componentDidUpdate() {
        if (this.props.autosize) {
            this.autoSize();
        }
    }

    render() {
        const {
            className,
            tag,
            autosize,
            value,
            rows,
            type,
            minLength,
            onChange: ignoreOnChange, // We implemented our custom onChange function above.
            postChange,
            innerRef,
            maxLength,
            ...rest
        } = this.props;

        return (
            <Text
                type={type || 'text'}
                minLength={minLength || 0}
                // Minimal textarea height, avoid null heights for autoSized inputs.
                rows={rows || 1}
                tag={tag || (autosize ? 'textarea' : 'input')}
                className={`${autosize ? css.autosize : ''} ${className || ''}`}
                onChange={this.handleChange}
                value={value}
                // Keep ref consistent if a ref was set from callback in parent component
                ref={
                    typeof this.props.innerRef === 'function' ?
                        node => {
                            // @ts-ignore
                            innerRef(node);
                            this.ref = {current: node};
                        } : this.ref
                }
                {...rest}
            />
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
        ) => <Input innerRef={ref} {...props}/>
    )
);