package middlewares

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// InjectUserIDQuery: หลังผ่าน AuthRequired แล้ว
// เติม user_id ลง query ให้ /orders และ /payments (เฉพาะ GET)
// อ่านจาก context: userID (ที่ AuthRequired set ไว้)
func InjectUserIDQuery() gin.HandlerFunc {
	return func(c *gin.Context) {
		fp := c.FullPath()
		if c.Request.Method == http.MethodGet && (fp == "/orders" || fp == "/payments") {
			if c.Query("user_id") == "" {
				if uidAny, ok := c.Get("userID"); ok && uidAny != nil {
					q := c.Request.URL.Query()
					q.Set("user_id", toString(uidAny))
					c.Request.URL.RawQuery = q.Encode()
				}
			}
		}
		c.Next()
	}
}

func toString(v any) string {
	switch x := v.(type) {
	case string:
		return x
	case uint:
		return strconv.Itoa(int(x))
	case int:
		return strconv.Itoa(x)
	case int64:
		return strconv.Itoa(int(x))
	case uint64:
		return strconv.Itoa(int(x))
	case *uint:
		if x != nil {
			return strconv.Itoa(int(*x))
		}
	}
	return ""
}
