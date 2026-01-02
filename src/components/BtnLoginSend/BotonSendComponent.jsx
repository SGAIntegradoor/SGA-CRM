const BotonSendComponent = ({ text, callback, styles, id}) => {
  return (
    <button className={styles} type="submit">
      { text }
    </button>
  )
}

export default BotonSendComponent
