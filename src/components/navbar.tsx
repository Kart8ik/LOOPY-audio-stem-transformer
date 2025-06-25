import { Link } from "react-router-dom"

const navbar = () => {
  return (
    <div className="m-3 flex bg-primary text-primary-foreground rounded-full w-auto justify-between items-center p-3 px-6">
      <Link to="/">
        <h1 className="text-2xl font-bold">Loopy</h1>
      </Link>
      <div className="flex flex-row justify-end items-end gap-8">
        <Link to="/loopy" className="text-sm font-semibold">LOOPIFY</Link>
        <Link to="/how-to-use" className="text-sm font-semibold">HOW TO USE</Link>
        <Link to="/contact" className="text-sm font-semibold">CONTACT</Link>
      </div>
    </div>
  )
}

export default navbar
