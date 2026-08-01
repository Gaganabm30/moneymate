function Card({children,className=""}){

    return(

        <div className={`mm-card cardHover ${className}`}>

            {children}

        </div>

    )

}

export default Card;