import type { ComponentPropsWithoutRef } from "react"

type PassFailProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
    pass: boolean
}

function PassFail({ pass, ...props }: PassFailProps) {
    const result = pass ? "pass" : "fail"
    return (
        <span {...props} className={result}>
            {result}
        </span>
    )
}

export default PassFail;
