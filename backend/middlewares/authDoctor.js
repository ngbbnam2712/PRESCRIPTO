import jwt from 'jsonwebtoken'



// user authentication middleware
const authDoctor = async (req, res, next) => {
    try {

        const dToken = req.headers.dtoken || req.headers.dToken


        if (!dToken) {
            return res.status(401).json({ success: false, message: "Not Authorized Login Again" })
        }


        const token_decode = jwt.verify(dToken, process.env.JWT_SECRET)


        req.docId = token_decode.id

        next()

    } catch (error) {
        console.error("Token error:", error.message)

        return res.status(401).json({ success: false, message: "Not authorized. Please sign in again" })
    }
}
export default authDoctor
