import type { ComponentPropsWithoutRef } from "react"

type PassFailProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
    pass: boolean
}

function PassFail({ pass, ...props }: PassFailProps) {
    return (
        <span {...props} className={pass ? "pass" : "fail"}>
            {pass ? "Pass" : "Fail"}
        </span>
    )
}

export default PassFail;
