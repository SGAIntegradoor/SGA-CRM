import { Link } from "react-router-dom"

const BotonUtil = ({ text, link, styles, id}) => {

  return (
    <button className={styles}>
      <Link to={link} target="_blank">{ text }</Link>
    </button>
  )
}

export default BotonUtil
