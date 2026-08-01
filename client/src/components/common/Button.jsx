function Button({

    children,

    onClick,

    type="button"

}){

    return(

        <button

        type={type}

        className="mm-btn"

        onClick={onClick}

        >

            {children}

        </button>

    )

}

export default Button;